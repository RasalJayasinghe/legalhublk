import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface TypewriterInputProps {
  value: string;
  onChange: (value: string) => void;
  onPage?: (page: number) => void;
  placeholder?: string;
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
}

const SAMPLE_QUERIES = [
  "Gazette No. 1234…",
  "Right to Information Act…"
];

export function TypewriterInput({ value, onChange, onPage, placeholder, className, inputRef }: TypewriterInputProps) {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentQueryIndex, setCurrentQueryIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const typewriterTimeoutRef = useRef<NodeJS.Timeout>();
  const isUserFocused = useRef(false);

  // Reset typing animation when user starts typing
  useEffect(() => {
    if (value) {
      clearTimeout(typewriterTimeoutRef.current);
      setIsTyping(false);
      setDisplayText("");
    }
  }, [value]);

  // Typewriter effect
  useEffect(() => {
    if (value || isUserFocused.current) return; // Don't animate if user has typed something or is focused

    const currentQuery = SAMPLE_QUERIES[currentQueryIndex];
    
    if (isDeleting) {
      if (displayText.length > 0) {
        typewriterTimeoutRef.current = setTimeout(() => {
          setDisplayText(currentQuery.slice(0, displayText.length - 1));
        }, 50);
      } else {
        setIsDeleting(false);
        setCurrentQueryIndex((prev) => (prev + 1) % SAMPLE_QUERIES.length);
        typewriterTimeoutRef.current = setTimeout(() => {
          setIsTyping(true);
        }, 500);
      }
    } else if (isTyping) {
      if (displayText.length < currentQuery.length) {
        typewriterTimeoutRef.current = setTimeout(() => {
          setDisplayText(currentQuery.slice(0, displayText.length + 1));
        }, 100);
      } else {
        setIsTyping(false);
        typewriterTimeoutRef.current = setTimeout(() => {
          setIsDeleting(true);
        }, 2000);
      }
    } else {
      // Start the cycle
      typewriterTimeoutRef.current = setTimeout(() => {
        setIsTyping(true);
      }, 1000);
    }

    return () => clearTimeout(typewriterTimeoutRef.current);
  }, [displayText, isTyping, isDeleting, currentQueryIndex, value]);

  const handleFocus = () => {
    isUserFocused.current = true;
    clearTimeout(typewriterTimeoutRef.current);
    setIsTyping(false);
    setDisplayText("");
  };

  const handleBlur = () => {
    isUserFocused.current = false;
    if (!value) {
      // Restart animation after a delay
      setTimeout(() => {
        if (!value && !isUserFocused.current) {
          setCurrentQueryIndex(0);
          setIsDeleting(false);
          setIsTyping(true);
          setDisplayText("");
        }
      }, 1000);
    }
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        ref={inputRef}
        placeholder={value ? placeholder : displayText || placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          onPage?.(1);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`pl-9 ${className}`}
        aria-label="Search legal documents"
      />
    </div>
  );
}