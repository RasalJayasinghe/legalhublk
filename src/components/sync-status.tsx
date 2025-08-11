import { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RefreshCw, Clock, Database, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncStatusProps {
  lastUpdated: Date | null;
  totalDocuments: number;
  hasNewDocuments: boolean;
  newDocumentsCount: number;
  isLoading: boolean;
  documentStats: {
    fetched: number;
    processed: number;
    filtered: number;
  };
  onRefresh: () => void;
  className?: string;
}

export function SyncStatus({
  lastUpdated,
  totalDocuments,
  hasNewDocuments,
  newDocumentsCount,
  isLoading,
  documentStats,
  onRefresh,
  className
}: SyncStatusProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = () => {
    if (isLoading) return 'text-yellow-600';
    if (hasNewDocuments) return 'text-green-600';
    return 'text-muted-foreground';
  };

  const getStatusIcon = () => {
    if (isLoading) return RefreshCw;
    if (hasNewDocuments) return AlertCircle;
    return CheckCircle;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Compact Status Display */}
      <div className="flex items-center gap-2">
        <Popover open={showDetails} onOpenChange={setShowDetails}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <StatusIcon className={cn("h-4 w-4", getStatusColor(), isLoading && "animate-spin")} />
              <span className="ml-1 text-sm font-medium">
                {totalDocuments.toLocaleString()}
              </span>
              {hasNewDocuments && (
                <Badge variant="secondary" className="ml-1 h-5 px-1 text-xs">
                  +{newDocumentsCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <Card className="border-0 shadow-none">
              <CardContent className="p-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Document Status</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="h-7 px-2"
                  >
                    <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
                    <span className="ml-1">Refresh</span>
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Database className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Total</span>
                    </div>
                    <p className="text-lg font-medium">{totalDocuments.toLocaleString()}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">New</span>
                    </div>
                    <p className={cn("text-lg font-medium", hasNewDocuments ? "text-green-600" : "text-muted-foreground")}>
                      {newDocumentsCount}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {lastUpdated && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Last Updated</span>
                      </div>
                      <p className="text-sm">
                        {format(lastUpdated, 'PPp')}
                      </p>
                    </div>
                  )}

                </div>

                {/* Processing Stats */}
                <div className="space-y-2 pt-2 border-t">
                  <h5 className="text-sm font-medium text-muted-foreground">Processing Stats</h5>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <p className="font-medium">{documentStats.fetched.toLocaleString()}</p>
                      <p className="text-muted-foreground">Fetched</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{documentStats.processed.toLocaleString()}</p>
                      <p className="text-muted-foreground">Processed</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{documentStats.filtered.toLocaleString()}</p>
                      <p className="text-muted-foreground">Filtered</p>
                    </div>
                  </div>
                </div>

                {/* Auto-sync Notice */}
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  Documents automatically sync every hour. Manual refresh fetches the latest data immediately.
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>
      </div>

      {/* Refresh Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
        className="h-8 px-2"
      >
        <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
      </Button>
    </div>
  );
}