import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, FileText, Layers, Calendar, Tag, Globe } from 'lucide-react';

interface LegalDocNorm {
  id: string;
  type: string;
  title: string;
  date: string;
  languages: string[];
  pdf_url?: string;
  detail_url?: string;
  summary: string;
  source: string;
  rawTypeName: string;
  full_content?: string;
  chunk_content?: string;
  metadata?: Record<string, any>;
  chunk_metadata?: Record<string, any>;
  hasFullContent?: boolean;
  isChunk?: boolean;
}

interface DocumentContentViewerProps {
  document: LegalDocNorm | null;
  open: boolean;
  onClose: () => void;
}

export function DocumentContentViewer({ document, open, onClose }: DocumentContentViewerProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'content' | 'metadata'>('summary');

  if (!document) {
    return null;
  }

  const hasContent = document.hasFullContent || document.isChunk;
  const contentText = document.full_content || document.chunk_content || '';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold line-clamp-2">
                {document.title}
              </DialogTitle>
              <DialogDescription className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="text-xs">
                  {document.type}
                </Badge>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {document.date}
                </span>
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {document.source}
                </span>
              </DialogDescription>
            </div>
            <div className="flex gap-2 ml-4">
              {document.pdf_url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={document.pdf_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    PDF
                  </a>
                </Button>
              )}
              {document.detail_url && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a href={document.detail_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Details
                  </a>
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex gap-1 border-b">
          <Button
            variant={activeTab === 'summary' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('summary')}
            className="rounded-b-none"
          >
            <FileText className="h-4 w-4 mr-1" />
            Summary
          </Button>
          {hasContent && (
            <Button
              variant={activeTab === 'content' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('content')}
              className="rounded-b-none"
            >
              <Layers className="h-4 w-4 mr-1" />
              {document.isChunk ? 'Chunk' : 'Content'}
            </Button>
          )}
          {(document.metadata || document.chunk_metadata) && (
            <Button
              variant={activeTab === 'metadata' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('metadata')}
              className="rounded-b-none"
            >
              <Tag className="h-4 w-4 mr-1" />
              Metadata
            </Button>
          )}
        </div>

        {/* Tab Content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4">
            {activeTab === 'summary' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Summary</h3>
                  <p className="text-sm leading-relaxed">{document.summary}</p>
                </div>
                
                {document.languages.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Languages</h4>
                    <div className="flex gap-1">
                      {document.languages.map((lang) => (
                        <Badge key={lang} variant="outline" className="text-xs">
                          {lang.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {document.isChunk && document.chunk_metadata && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Chunk Information</h4>
                    <div className="text-xs space-y-1 text-muted-foreground">
                      {document.chunk_metadata.section && (
                        <p>Section: {document.chunk_metadata.section}</p>
                      )}
                      {document.chunk_metadata.chunk_index !== undefined && (
                        <p>Chunk: {document.chunk_metadata.chunk_index + 1}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'content' && hasContent && (
              <div>
                <h3 className="font-medium mb-3">
                  {document.isChunk ? 'Chunk Content' : 'Full Document Content'}
                </h3>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/30 p-4 rounded-lg border">
                    {contentText}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'metadata' && (document.metadata || document.chunk_metadata) && (
              <div className="space-y-4">
                {document.metadata && (
                  <div>
                    <h4 className="font-medium mb-2">Document Metadata</h4>
                    <div className="space-y-2">
                      {Object.entries(document.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between py-1 text-sm">
                          <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span className="text-muted-foreground">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {document.chunk_metadata && (
                  <>
                    {document.metadata && <Separator />}
                    <div>
                      <h4 className="font-medium mb-2">Chunk Metadata</h4>
                      <div className="space-y-2">
                        {Object.entries(document.chunk_metadata).map(([key, value]) => (
                          <div key={key} className="flex justify-between py-1 text-sm">
                            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                            <span className="text-muted-foreground">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}