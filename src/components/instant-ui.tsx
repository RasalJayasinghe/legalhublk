import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

interface InstantUIProps {
  isLoading: boolean;
  progress: number;
  stage?: string;
  children: React.ReactNode;
}

export function InstantUI({ isLoading, progress, stage, children }: InstantUIProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-4">
      {/* Loading Progress */}
      <Card className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div className="text-sm font-medium">Loading documents...</div>
          <Badge variant="secondary">{Math.round(progress)}%</Badge>
        </div>
        
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {stage && (
          <div className="text-xs text-muted-foreground mt-2">{stage}</div>
        )}
      </Card>

      {/* Skeleton Grid */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="h-[200px]">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-16" />
              </div>
              
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5" />
              
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Show actual content if available */}
      <div style={{ opacity: progress > 50 ? 1 : 0.3 }}>
        {children}
      </div>
    </div>
  );
}