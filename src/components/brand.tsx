import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BrandProps {
  className?: string;
}

export function Brand({ className }: BrandProps) {
  return (
    <Link
      to="/"
      className={cn("inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-[var(--radius)]", className)}
      aria-label="Go to LegalHub LK home"
      title="LegalHub LK"
   >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">LH</span>
        </div>
        <span className="font-semibold text-foreground text-lg">LegalHub LK</span>
      </div>
      <span className="sr-only">LegalHub LK — Sri Lankan Legal Document Search</span>
    </Link>
  );
}
