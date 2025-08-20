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
  // Prevent duplicate banners by strict validation
  if (!visible || newDocumentsCount === 0 || newDocumentsCount < 0) return null;

  return (
    <Alert className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50">
      <Bell className="h-4 w-4 text-green-600" />
      <AlertDescription>
        {/* Mobile Layout */}
        <div className="sm:hidden space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {newDocumentsCount}
            </Badge>
            <span className="text-sm">
              new legal documents added
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              asChild 
              size="sm" 
              variant="outline"
              className="h-7 text-xs"
            >
              <Link to="/latest">
                View Latest
              </Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onMarkAllSeen}
              className="h-7 px-2 text-xs"
            >
              <Eye className="h-3 w-3" />
              <span className="ml-1">Mark All Seen</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              className="h-7 w-7 p-0 ml-auto"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="mr-2">
              {newDocumentsCount}
            </Badge>
            <span>new legal documents have been added</span>
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
        </div>
      </AlertDescription>
    </Alert>
  );
}