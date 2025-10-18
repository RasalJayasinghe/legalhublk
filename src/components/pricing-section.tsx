import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function PricingSection() {
  const features = [
    'Full platform access for your firm',
    'Upload unlimited legal documents',
    'Featured partner profile',
    'Priority support & onboarding',
    'Analytics dashboard access',
    'Early access to new features',
    'Dedicated account manager',
    'Custom branding options'
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm font-medium">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Limited Time Offer
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Partnership Pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Join as a founding partner and help shape the future of legal research in Sri Lanka
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto">
          <Card className="relative overflow-hidden border-2 border-primary/20 shadow-xl hover:shadow-2xl transition-all duration-300">
            {/* Gradient background effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
            
            <CardHeader className="relative pb-8 pt-8">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl font-bold">Founding Partner</CardTitle>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/30">
                  Exclusive
                </Badge>
              </div>
              <CardDescription className="text-base">
                Complete partnership package with lifetime benefits
              </CardDescription>
              
              {/* Price */}
              <div className="mt-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl md:text-6xl font-bold tracking-tight">
                    75,000
                  </span>
                  <div className="flex flex-col">
                    <span className="text-2xl font-semibold text-muted-foreground">LKR</span>
                    <span className="text-sm text-muted-foreground">one-time</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative space-y-6">
              {/* Features List */}
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-primary/10 p-1">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Button 
                size="lg" 
                className="w-full mt-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Apply Now
              </Button>

              {/* Small print */}
              <p className="text-xs text-center text-muted-foreground pt-2">
                Limited to first 10 partners • Offer expires December 2025
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional info */}
        <div className="text-center mt-8 text-sm text-muted-foreground max-w-2xl mx-auto">
          <p>
            This exclusive founding partner rate includes everything you need to establish your firm as a key contributor 
            to Sri Lanka's legal knowledge ecosystem. Questions? Contact us at <a href="mailto:partners@legalhub.lk" className="text-primary hover:underline">partners@legalhub.lk</a>
          </p>
        </div>
      </div>
    </section>
  );
}
