import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Heart, Sparkles, X } from "lucide-react";

interface InterestPopupProps {
  isOpen: boolean;
  onClose: () => void;
  timeOnSite: number;
}

export const InterestPopup = ({ isOpen, onClose, timeOnSite }: InterestPopupProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResponse = async (response: "yes" | "not-yet" | "never") => {
    setIsSubmitting(true);
    
    // Set localStorage based on response
    if (response === "never") {
      localStorage.setItem("legalhub-interest-response", "never");
    } else {
      localStorage.setItem("legalhub-interest-response", response);
      // Set expiry for 30 days for yes/not-yet responses
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      localStorage.setItem("legalhub-interest-expiry", expiryDate.toISOString());
    }

    try {
      console.log("Submitting form with data:", { response, timeOnSite });
      
      // Submit to Netlify Forms
      const netlifyResponse = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          "form-name": "interest-validation",
          "bot-field": "",
          response,
          timestamp: new Date().toISOString(),
          timeOnSite: timeOnSite.toString(),
          userAgent: navigator.userAgent,
          currentPage: window.location.href,
        }).toString(),
      });

      console.log("Form submission response:", netlifyResponse.status, netlifyResponse.statusText);

      if (netlifyResponse.ok) {
        toast.success("Thank you for your feedback!");
        
        if (response === "yes") {
          toast.success("🚀 We're excited about your interest! Stay tuned for updates.", {
            duration: 5000,
          });
        }
      } else {
        console.error("Form submission failed:", netlifyResponse.status, netlifyResponse.statusText);
        throw new Error(`Form submission failed: ${netlifyResponse.status}`);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Something went wrong, but your preference has been saved locally.");
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Love what you see?
          </DialogTitle>
          <DialogDescription className="text-base">
            Are you interested in having LegalHub LK available for wider public use?
          </DialogDescription>
        </DialogHeader>
        
        {/* Hidden form for Netlify Forms detection */}
        <form 
          name="interest-validation" 
          hidden
          data-netlify="true"
          data-netlify-honeypot="bot-field"
        >
          <input type="hidden" name="form-name" value="interest-validation" />
          <input type="hidden" name="bot-field" />
          <input type="text" name="response" />
          <input type="text" name="timestamp" />
          <input type="text" name="timeOnSite" />
          <input type="text" name="userAgent" />
          <input type="text" name="currentPage" />
        </form>

        <div className="space-y-3 pt-2">
          <Button
            onClick={() => handleResponse("yes")}
            disabled={isSubmitting}
            className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Yes, launch it! 🚀
          </Button>
          
          <Button
            onClick={() => handleResponse("not-yet")}
            disabled={isSubmitting}
            variant="outline"
            className="w-full h-10"
          >
            Not yet, needs improvement
          </Button>
          
          <Button
            onClick={() => handleResponse("never")}
            disabled={isSubmitting}
            variant="ghost"
            className="w-full h-8 text-sm text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3 mr-1" />
            Never ask again
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-4">
          Your response helps us understand community interest. Anonymous data only.
        </p>
      </DialogContent>
    </Dialog>
  );
};