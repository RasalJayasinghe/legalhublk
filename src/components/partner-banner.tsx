import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PartnerBannerProps {
  onDismiss: () => void;
}

export function PartnerBanner({ onDismiss }: PartnerBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Slide in animation after mount
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Wait for slide-out animation
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="bg-gradient-to-r from-primary/90 to-primary/80 backdrop-blur-sm border-t border-primary-foreground/20 shadow-lg">
        <div className="container max-w-7xl">
          <div className="flex items-center justify-between gap-4 py-3 px-4">
            {/* Mobile Layout */}
            <div className="flex items-center gap-3 flex-1 sm:hidden">
              <Briefcase className="h-4 w-4 text-primary-foreground shrink-0" />
              <span className="text-sm text-primary-foreground">
                Law firm? Partner with us
              </span>
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="h-7 ml-auto"
              >
                <Link to="/partners">Learn More</Link>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="h-7 w-7 p-0 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center justify-between gap-4 w-full">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-primary-foreground" />
                <span className="text-sm text-primary-foreground font-medium">
                  Are you a law firm? Partner with LegalHub to reach more clients
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="h-8"
                >
                  <Link to="/partners">Learn More</Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
