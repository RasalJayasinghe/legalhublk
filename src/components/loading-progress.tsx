import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface LoadingProgressProps {
  stage: string;
  progress: number;
  totalDocuments?: number;
  processedDocuments?: number;
}

export function LoadingProgress({ 
  stage, 
  progress, 
  totalDocuments, 
  processedDocuments 
}: LoadingProgressProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="flex items-center space-x-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <h2 className="text-xl font-semibold">Loading LegalHub LK</h2>
      </div>
      
      <div className="w-full max-w-md space-y-3">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{stage}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        
        <Progress value={progress} className="h-2" />
        
        {totalDocuments && processedDocuments !== undefined && (
          <div className="text-center text-sm text-muted-foreground">
            {processedDocuments > 0 && (
              <span>
                Processed {processedDocuments.toLocaleString()} of {totalDocuments.toLocaleString()} documents
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="text-center text-sm text-muted-foreground max-w-md">
        <p>Fetching the latest legal documents from the official Sri Lankan repository...</p>
      </div>
    </div>
  );
}