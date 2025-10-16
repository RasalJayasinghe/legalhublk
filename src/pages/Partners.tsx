import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle2, Upload, DollarSign, Award, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Partners() {
  const [formData, setFormData] = useState({
    firmName: '',
    contactName: '',
    email: '',
    website: '',
    firmSize: '',
    practiceAreas: '',
    partnershipType: '',
    monthlyUploads: '',
    whyPartner: '',
    agreeTerms: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreeTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    // TODO: Implement actual form submission
    toast.success('Application submitted successfully! We\'ll be in touch soon.');
    console.log('Partner application:', formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="text-xl font-bold">
            LegalHub <span className="text-primary">LK</span>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Partner with LegalHub — Empower the Future of Legal Research
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We collaborate with forward-thinking law firms to bring Sri Lanka's legal knowledge online.
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-card/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Partner Benefits</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Application Form Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Apply to Become a Partner</CardTitle>
              <CardDescription>
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
                <div className="grid md:grid-cols-2 gap-4">
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
                    value={formData.practiceAreas}
                    onChange={(e) => handleChange('practiceAreas', e.target.value)}
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

                {/* Expected Monthly Uploads */}
                <div className="space-y-2">
                  <Label htmlFor="monthlyUploads">Expected Monthly Uploads (Optional)</Label>
                  <Input
                    id="monthlyUploads"
                    value={formData.monthlyUploads}
                    onChange={(e) => handleChange('monthlyUploads', e.target.value)}
                    placeholder="5-10 documents"
                  />
                </div>

                {/* Why Partner */}
                <div className="space-y-2">
                  <Label htmlFor="whyPartner">Why do you want to partner with LegalHub LK? *</Label>
                  <Textarea
                    id="whyPartner"
                    required
                    value={formData.whyPartner}
                    onChange={(e) => handleChange('whyPartner', e.target.value)}
                    placeholder="Tell us about your motivation and goals..."
                    rows={4}
                  />
                </div>

                {/* Terms Agreement */}
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeTerms}
                    onCheckedChange={(checked) => handleChange('agreeTerms', checked)}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the terms and conditions and privacy policy
                  </label>
                </div>

                {/* Submit Button */}
                <Button type="submit" size="lg" className="w-full">
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Submit Application
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 LegalHub LK. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
