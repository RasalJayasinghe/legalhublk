import { Card, CardContent } from "@/components/ui/card";

interface DocumentSkeletonProps {
  count?: number;
}

export function DocumentSkeleton({ count = 6 }: DocumentSkeletonProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="group animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              {/* Icon skeleton */}
              <div className="h-10 w-10 rounded-md bg-muted animate-pulse shrink-0" />
              
              <div className="flex-1 min-w-0 space-y-3">
                {/* Title skeleton */}
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" style={{ width: `${75 + Math.random() * 20}%` }} />
                  <div className="h-4 bg-muted rounded animate-pulse" style={{ width: `${60 + Math.random() * 25}%` }} />
                </div>
                
                {/* Summary skeleton */}
                <div className="space-y-1.5">
                  <div className="h-3 bg-muted/70 rounded animate-pulse" style={{ width: `${85 + Math.random() * 15}%` }} />
                  <div className="h-3 bg-muted/70 rounded animate-pulse" style={{ width: `${70 + Math.random() * 20}%` }} />
                  <div className="h-3 bg-muted/70 rounded animate-pulse" style={{ width: `${55 + Math.random() * 25}%` }} />
                </div>
                
                {/* Badges and date skeleton */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
                    {Math.random() > 0.7 && (
                      <div className="h-5 w-10 bg-primary/20 rounded-full animate-pulse" />
                    )}
                  </div>
                  <div className="h-3 w-20 bg-muted/60 rounded animate-pulse" />
                </div>
              </div>
            </div>
            
            {/* Button skeleton */}
            <div className="mt-4 flex justify-end">
              <div className="h-8 w-20 bg-muted rounded animate-pulse" />
            </div>
            
            {/* Shimmer effect overlay */}
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-muted/20 to-transparent" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}