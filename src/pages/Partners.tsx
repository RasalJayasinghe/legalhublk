import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle2, Upload, DollarSign, Award, BarChart3, User, LogOut } from 'lucide-react';
import { Brand } from '@/components/brand';
import { ThemeToggle } from '@/components/theme-toggle';
import { ShareButton } from '@/components/share-button';
import { PricingSection } from '@/components/pricing-section';
import { HeroSection } from '@/components/ui/hero-section-dark';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function Partners() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    firmName: '',
    contactName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    website: '',
    firmSize: '',
    practiceAreas: [] as string[],
    partnershipType: '',
    yearsInPractice: '',
    message: '',
    agreeTerms: false
  });

  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to submit your application');
      navigate('/auth');
      return;
    }
    
    if (!formData.agreeTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    if (formData.practiceAreas.length === 0) {
      toast.error('Please select at least one practice area');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('partner_applications').insert({
        user_id: user.id,
        firm_name: formData.firmName,
        contact_person: formData.contactName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        website: formData.website,
        firm_size: formData.firmSize,
        practice_areas: formData.practiceAreas,
        partnership_type: formData.partnershipType,
        years_in_practice: formData.yearsInPractice ? parseInt(formData.yearsInPractice) : null,
        message: formData.message
      });

      if (error) throw error;

      toast.success('Application submitted successfully! We\'ll review it and be in touch soon.');
      
      // Reset form
      setFormData({
        firmName: '',
        contactName: '',
        email: user.email || '',
        phone: '',
        address: '',
        website: '',
        firmSize: '',
        practiceAreas: [],
        partnershipType: '',
        yearsInPractice: '',
        message: '',
        agreeTerms: false
      });
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation - Same as homepage */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Brand className="shrink-0" />
            <div className="flex items-center gap-2">
              <ShareButton />
              <ThemeToggle />
              {user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="gap-2"
                >
                  <User className="h-4 w-4" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection
        title="Partner with LegalHub"
        subtitle={{
          regular: "Partner with LegalHub ",
          gradient: "Empower the Future of Legal Research",
        }}
        description="We collaborate with forward-thinking law firms to bring Sri Lanka's legal knowledge online. Join us in building the future of legal technology."
        ctaText="Apply to Partner"
        onCtaClick={() => {
          document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' });
        }}
        gridOptions={{
          angle: 65,
          opacity: 0.4,
          cellSize: 50,
          lightLineColor: "#4a4a4a",
          darkLineColor: "#7209B7",
        }}
      />

      {/* Benefits Section */}
      <section id="benefits" className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12 text-foreground">Partner Benefits</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card>
              <CardHeader>
                <Upload className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-lg">Upload & Monetize</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Upload and monetize your legal case studies or insights
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <DollarSign className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-lg">Earn Commissions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Earn referral commissions for client signups
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Award className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-lg">Get Featured</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get featured as a verified partner firm
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-lg">Access Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Access analytics and early product releases
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* Application Form Section */}
      <section id="application-form" className="py-12 md:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Apply to Become a Partner</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Fill out the form below and our team will review your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Law Firm Name */}
                <div className="space-y-2">
                  <Label htmlFor="firmName">Law Firm Name *</Label>
                  <Input
                    id="firmName"
                    required
                    value={formData.firmName}
                    onChange={(e) => handleChange('firmName', e.target.value)}
                    placeholder="ABC Law Associates"
                  />
                </div>

                {/* Contact Person */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Person Name *</Label>
                    <Input
                      id="contactName"
                      required
                      value={formData.contactName}
                      onChange={(e) => handleChange('contactName', e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="john@lawfirm.lk"
                    />
                  </div>
                </div>

                {/* Website */}
                <div className="space-y-2">
                  <Label htmlFor="website">Website (Optional)</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://lawfirm.lk"
                  />
                </div>

                {/* Phone and Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+94 11 234 5678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address (Optional)</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="Colombo, Sri Lanka"
                    />
                  </div>
                </div>

                {/* Firm Size */}
                <div className="space-y-2">
                  <Label htmlFor="firmSize">Firm Size / Team Members *</Label>
                  <Input
                    id="firmSize"
                    required
                    value={formData.firmSize}
                    onChange={(e) => handleChange('firmSize', e.target.value)}
                    placeholder="10-50 members"
                  />
                </div>

                {/* Practice Areas */}
                <div className="space-y-2">
                  <Label htmlFor="practiceAreas">Area(s) of Practice *</Label>
                  <Input
                    id="practiceAreas"
                    required
                    value={formData.practiceAreas.join(', ')}
                    onChange={(e) => handleChange('practiceAreas', e.target.value.split(',').map(s => s.trim()))}
                    placeholder="Corporate Law, IP Law, Taxation"
                  />
                </div>

                {/* Partnership Type */}
                <div className="space-y-2">
                  <Label htmlFor="partnershipType">Preferred Partnership Type *</Label>
                  <Select
                    required
                    value={formData.partnershipType}
                    onValueChange={(value) => handleChange('partnershipType', value)}
                  >
                    <SelectTrigger id="partnershipType">
                      <SelectValue placeholder="Select partnership type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upload">Upload Contributor (share cases/docs)</SelectItem>
                      <SelectItem value="referral">Referral Partner (earn commission)</SelectItem>
                      <SelectItem value="enterprise">Enterprise Partner (use LegalHub internally)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Years in Practice */}
                <div className="space-y-2">
                  <Label htmlFor="yearsInPractice">Years in Practice (Optional)</Label>
                  <Input
                    id="yearsInPractice"
                    type="number"
                    value={formData.yearsInPractice}
                    onChange={(e) => handleChange('yearsInPractice', e.target.value)}
                    placeholder="10"
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">Why do you want to partner with LegalHub? *</Label>
                  <Textarea
                    id="message"
                    required
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    placeholder="Tell us about your motivation and goals..."
                    rows={4}
                  />
                </div>

                {/* Terms Agreement */}
                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeTerms}
                    onCheckedChange={(checked) => handleChange('agreeTerms', checked)}
                    className="mt-1"
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    I agree to the terms and conditions and privacy policy
                  </label>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full mt-2" 
                  disabled={isSubmitting || !user}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                  {!user ? 'Sign in to Submit Application' : isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
                {!user && (
                  <p className="text-sm text-center text-muted-foreground mt-2">
                    You need to <button type="button" onClick={() => navigate('/auth')} className="text-primary hover:underline">sign in</button> to submit your application
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-16 bg-background">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 LegalHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
