import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Bell, X, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NewDocumentsBannerProps {
  newDocumentsCount: number;
  onDismiss: () => void;
  onMarkAllSeen: () => void;
  visible: boolean;
}

export function NewDocumentsBanner({
  newDocumentsCount,
  onDismiss,
  onMarkAllSeen,
  visible
}: NewDocumentsBannerProps) {
  if (!visible || newDocumentsCount === 0) return null;

  return (
    <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50">
      <Bell className="h-4 w-4 text-green-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>
            <Badge variant="secondary" className="mr-2">
              {newDocumentsCount}
            </Badge>
            new legal documents have been added
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            asChild 
            size="sm" 
            variant="outline"
            className="h-7"
          >
            <Link to="/latest">
              View Latest
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onMarkAllSeen}
            className="h-7 px-2"
          >
            <Eye className="h-3 w-3" />
            <span className="ml-1">Mark All Seen</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="h-7 w-7 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}