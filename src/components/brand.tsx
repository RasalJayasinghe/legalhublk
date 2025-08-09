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
        src="/logo-light.png"
        alt="LegalHub LK logo"
        className="block dark:hidden h-8 md:h-9 w-auto"
        loading="eager"
        decoding="async"
      />
      {/* Dark mode logo */}
      <img
        src="/logo-dark.png"
        alt="LegalHub LK logo"
        className="hidden dark:block h-8 md:h-9 w-auto"
        loading="eager"
        decoding="async"
      />
      <span className="sr-only">LegalHub LK — Sri Lankan Legal Document Search</span>
    </Link>
  );
}
