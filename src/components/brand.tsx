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
        src="/lovable-uploads/5a843890-1d9c-4621-a229-59967e3c1c65.png"
        alt="LegalHub LK logo"
        className="block dark:hidden h-8 md:h-9 w-auto"
        loading="eager"
        decoding="async"
      />
      {/* Dark mode logo */}
      <img
        src="/lovable-uploads/15eb43ee-5a02-44f3-97e5-4803d5e8aac5.png"
        alt="LegalHub LK logo"
        className="hidden dark:block h-8 md:h-9 w-auto"
        loading="eager"
        decoding="async"
      />
      <span className="sr-only">LegalHub LK — Sri Lankan Legal Document Search</span>
    </Link>
  );
}
