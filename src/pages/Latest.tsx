import { useEffect, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { FileText, ScrollText, Newspaper, Loader2 } from "lucide-react";
import { LoadingProgress } from "@/components/loading-progress";
import { SyncStatus } from "@/components/sync-status";
import { useDocumentSync, type LegalDocNorm } from "@/hooks/useDocumentSync";

function typeIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes("act")) return ScrollText;
  if (t.includes("bill")) return FileText;
  return Newspaper;
}

const Latest = () => {
  const {
    docs,
    loading,
    error,
    lastUpdated,
    totalDocuments,
    newDocuments,
    hasNewDocuments,
    documentStats,
    loadingStage,
    loadingProgress,
    refreshData,
    markAllAsSeen
  } = useDocumentSync();

  useEffect(() => {
    document.title = "Latest - LegalHub LK";
  }, []);

  const latestNew = useMemo(() => {
    return newDocuments.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [newDocuments]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container py-6 md:py-8">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Latest legal documents</h1>
              <p className="mt-2 text-muted-foreground">New additions since your last visit.</p>
            </div>
            <div className="flex items-center gap-2">
              <SyncStatus
                lastUpdated={lastUpdated}
                totalDocuments={totalDocuments}
                hasNewDocuments={hasNewDocuments}
                newDocumentsCount={newDocuments.length}
                isLoading={loading}
                documentStats={documentStats}
                onRefresh={refreshData}
              />
              <Button asChild variant="outline"><Link to="/">Back to search</Link></Button>
              <Button onClick={markAllAsSeen} variant="secondary">Mark all seen</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="flex items-center justify-between">
          {loading ? (
            <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {latestNew.length} new document{latestNew.length === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <Separator className="my-4" />

        {loading && (
          <LoadingProgress
            stage={loadingStage}
            progress={loadingProgress}
            totalDocuments={totalDocuments}
          />
        )}

        {!loading && latestNew.length === 0 && (
          <p className="text-muted-foreground">You're all caught up. No new documents.</p>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {latestNew.map((d) => {
            const Icon = typeIcon(d.type);
            return (
              <article key={d.id} className="group">
                <Card className="transition-transform duration-200 group-hover:-translate-y-0.5">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-md bg-accent flex items-center justify-center">
                          <Icon className="h-5 w-5 text-accent-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-semibold leading-snug">{d.title}</h2>
                            <Badge variant="secondary" className="shrink-0">New</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            <span>{d.type}</span>
                            {d.date && <span className="mx-2">•</span>}
                            {d.date && <time dateTime={d.date}>{format(parseISO(d.date), "PPP")}</time>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </article>
            );
          })}
        </div>
      </main>

      <footer className="border-t">
        <div className="container py-6 text-xs text-muted-foreground">
          Made with Love by Rasal J
        </div>
      </footer>
    </div>
  );
};

export default Latest;