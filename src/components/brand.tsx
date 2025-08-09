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
        src="/lovable-uploads/874dbe7c-de46-4b94-8a26-114afa2f8856.png"
        alt="LegalHub LK logo"
        className="block dark:hidden h-8 md:h-9 w-auto"
        loading="eager"
        decoding="async"
      />
      {/* Dark mode logo */}
      <img
        src="/lovable-uploads/0d8e20ac-ad0d-43a0-87ca-664a5de4a417.png"
        alt="LegalHub LK logo"
        className="hidden dark:block h-8 md:h-9 w-auto"
        loading="eager"
        decoding="async"
      />
      <span className="sr-only">LegalHub LK — Sri Lankan Legal Document Search</span>
    </Link>
  );
}
