import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BrandProps {
  className?: string;
}

export function Brand({ className }: BrandProps) {
  return (
    <Link
      to="/"
      className={cn("inline-flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-[var(--radius)] transition-all duration-300 hover:scale-105 group", className)}
      aria-label="Go to LegalHub LK home"
      title="LegalHub LK"
   >
      {/* Light mode logo */}
      <img
        src="/lovable-uploads/e189b7a3-97eb-4dfa-accc-b20ddedb2adb.png"
        alt="LegalHub LK logo"
        className="block dark:hidden h-8 sm:h-10 md:h-12 lg:h-14 w-auto transition-all duration-300 group-hover:brightness-110"
        loading="eager"
        decoding="async"
      />
      {/* Dark mode logo */}
      <img
        src="/lovable-uploads/c65fb381-20d7-43ea-bb0e-090e6eda9ff2.png"
        alt="LegalHub LK logo"
        className="hidden dark:block h-8 sm:h-10 md:h-12 lg:h-14 w-auto transition-all duration-300 group-hover:brightness-110"
        loading="eager"
        decoding="async"
      />
      <span className="sr-only">LegalHub LK — Sri Lankan Legal Document Search</span>
    </Link>
  );
}
