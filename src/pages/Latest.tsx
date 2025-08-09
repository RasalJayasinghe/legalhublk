import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { FileText, ScrollText, Newspaper, Loader2 } from "lucide-react";

interface LegalDocRaw {
  doc_type_name: string;
  id: string;
  date: string;
  description: string;
}

interface LegalDocNorm {
  id: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  type: string;
  summary: string;
  pdfUrl: string;
  rawTypeName: string;
}

const DATA_URLS = [
  "https://raw.githubusercontent.com/nuuuwan/lk_legal_docs/main/data/all.json",
];

function typeIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes("act")) return ScrollText;
  if (t.includes("bill")) return FileText;
  return Newspaper;
}

function normalize(raw: LegalDocRaw): LegalDocNorm | null {
  try {
    const date = new Date(raw.date);
    if (isNaN(date.getTime())) return null;

    const typeMap: Record<string, string> = {
      acts: "Act",
      bills: "Bill",
      gazettes: "Gazette",
      "extra-gazettes": "Extraordinary Gazette",
    };

    const displayType = typeMap[raw.doc_type_name] || raw.doc_type_name;
    const title = raw.description || "Untitled";

    return {
      id: raw.id,
      title,
      date: raw.date,
      type: displayType,
      summary: raw.description || "",
      pdfUrl: "",
      rawTypeName: raw.doc_type_name,
    };
  } catch {
    return null;
  }
}

const Latest = () => {
  const [docs, setDocs] = useState<LegalDocNorm[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIdSet, setNewIdSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    document.title = "Latest - LegalHub LK";
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      for (const url of DATA_URLS) {
        try {
          const res = await fetch(url, { headers: { Accept: "application/json" } });
          if (!res.ok) continue;
          const data = await res.json();
          const arr: LegalDocRaw[] = Array.isArray(data) ? data : data?.items || data?.docs || [];
          const normalized = arr.map(normalize).filter(Boolean) as LegalDocNorm[];
          if (!cancelled) {
            setDocs(normalized);
            // compute new ids vs localStorage
            try {
              const storedRaw = localStorage.getItem("lh_seen_ids");
              const currentIds = Array.from(new Set(normalized.map((d) => d.id)));
              if (!storedRaw) {
                localStorage.setItem("lh_seen_ids", JSON.stringify(currentIds));
                setNewIdSet(new Set());
              } else {
                const storedArr: string[] = JSON.parse(storedRaw || "[]");
                const storedSet = new Set<string>(storedArr);
                const newIds = currentIds.filter((id) => !storedSet.has(id));
                setNewIdSet(new Set(newIds));
              }
            } catch {
              setNewIdSet(new Set());
            }
            setLoading(false);
          }
          return;
        } catch (e) {
          // try next URL
        }
      }
      if (!cancelled) {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const latestNew = useMemo(() => {
    const arr = docs.filter((d) => newIdSet.has(d.id));
    return arr.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [docs, newIdSet]);

  const handleMarkSeen = () => {
    try {
      const ids = docs.map((d) => d.id);
      localStorage.setItem("lh_seen_ids", JSON.stringify(ids));
    } catch {}
    setNewIdSet(new Set());
  };

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
              <Button asChild variant="outline"><Link to="/">Back to search</Link></Button>
              <Button onClick={handleMarkSeen} variant="secondary">Mark all seen</Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="flex items-center justify-between">
          {loading ? (
            <p className="text-sm text-muted-foreground inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
          ) : (
            <p className="text-sm text-muted-foreground">{latestNew.length} new document{latestNew.length === 1 ? "" : "s"}</p>
          )}
        </div>
        <Separator className="my-4" />

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
