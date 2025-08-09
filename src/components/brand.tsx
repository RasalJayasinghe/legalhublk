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
      {/* Light mode logo */}
      <img
        src="/lovable-uploads/22958380-d916-4f07-bb33-7a212cb32fa7.png"
        alt="LegalHub LK logo (light mode)"
        className="block dark:hidden h-8 md:h-9 w-auto"
        loading="eager"
        decoding="async"
      />
      {/* Dark mode logo */}
      <img
        src="/lovable-uploads/4c31a5de-3659-4720-9b4e-277bb1804f72.png"
        alt="LegalHub LK logo (dark mode)"
        className="hidden dark:block h-8 md:h-9 w-auto"
        loading="eager"
        decoding="async"
      />
      <span className="sr-only">LegalHub LK — Sri Lankan Legal Document Search</span>
    </Link>
  );
}
