import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DocumentCountDisplayProps {
  totalDocuments: number;
  newDocumentsCount: number;
  hasNewDocuments: boolean;
  className?: string;
}

export function DocumentCountDisplay({
  totalDocuments,
  newDocumentsCount,
  hasNewDocuments,
  className
}: DocumentCountDisplayProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm font-medium">
        {totalDocuments.toLocaleString()}
      </span>
      {hasNewDocuments && newDocumentsCount > 0 && (
        <Badge variant="secondary" className="h-5 px-2 text-xs">
          +{newDocumentsCount}
        </Badge>
      )}
    </div>
  );
}