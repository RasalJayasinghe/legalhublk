import { useEffect, useMemo, useRef, useState } from "react";
import lunr from "lunr";
import { format, parseISO, isAfter, isBefore } from "date-fns";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { FileText, ScrollText, Newspaper, Search, SlidersHorizontal, Loader2 } from "lucide-react";

// Types
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
}

const DATA_URLS = [
  "https://raw.githubusercontent.com/nuuuwan/lk_legal_docs/main/data/all.json",
];

const PAGE_SIZE = 20;
const DOC_TYPES = ["Gazette", "Extraordinary Gazette", "Act", "Bill"] as const;

type TypeFilter = typeof DOC_TYPES[number];

function typeIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes("act")) return ScrollText;
  if (t.includes("bill")) return FileText;
  return Newspaper;
}

function normalize(raw: LegalDocRaw, idx: number): LegalDocNorm | null {
  try {
    const date = new Date(raw.date);
    if (isNaN(date.getTime())) return null;
    
    // Map doc_type_name to display type
    const typeMap: Record<string, string> = {
      'acts': 'Act',
      'bills': 'Bill',
      'gazettes': 'Gazette',
      'extra-gazettes': 'Extraordinary Gazette'
    };
    
    const displayType = typeMap[raw.doc_type_name] || raw.doc_type_name;
    const title = raw.description || 'Untitled';
    const pdfUrl = `https://documents.gov.lk/${raw.doc_type_name}/${raw.id}.pdf`;
    
    return {
      id: raw.id,
      title,
      date: raw.date,
      type: displayType,
      summary: raw.description || '',
      pdfUrl,
    };
  } catch {
    return null;
  }
}

const Index = () => {
  const [docs, setDocs] = useState<LegalDocNorm[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<TypeFilter[]>([]);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [idx, setIdx] = useState<lunr.Index | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Fetch dataset from GitHub raw JSON (try working URL)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      for (const url of DATA_URLS) {
        try {
          const res = await fetch(url, { headers: { Accept: "application/json" } });
          if (!res.ok) continue;
          const data = await res.json();
          const arr: LegalDocRaw[] = Array.isArray(data) ? data : data?.items || data?.docs || [];
          if (!Array.isArray(arr) || arr.length === 0) continue;
          const normalized = arr.map(normalize).filter(Boolean) as LegalDocNorm[];
          if (!cancelled) {
            setDocs(normalized);
            setPage(1);
            // Build lunr index
            const built = lunr(function () {
              this.ref("id");
              this.field("title");
              this.field("summary");
              this.field("type");
              normalized.forEach((d) => this.add(d));
            });
            setIdx(built);
            setLoading(false);
          }
          return; // success
        } catch (e) {
          // try next URL
        }
      }
      if (!cancelled) {
        const msg = "Failed to load dataset from GitHub";
        setError(msg);
        toast.error(msg);
        setDocs([]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // Infinite scroll intersection observer will be set up after filters are computed


  // Filter + Search
  const filtered = useMemo(() => {
    let base: LegalDocNorm[] = docs;

    // Search with lunr if query
    if (idx && query.trim()) {
      try {
        const results = idx.search(query.trim());
        const map = new Map(docs.map((d) => [d.id, d] as const));
        base = results.map((r) => map.get(r.ref)).filter(Boolean) as LegalDocNorm[];
      } catch {
        // if lunr query fails (e.g., wildcard), fallback simple contains
        const q = query.toLowerCase();
        base = docs.filter((d) =>
          d.title.toLowerCase().includes(q) ||
          d.summary.toLowerCase().includes(q) ||
          d.type.toLowerCase().includes(q)
        );
      }
    }

    // Type filters
    if (selectedTypes.length) {
      base = base.filter((d) =>
        selectedTypes.some((t) => d.type.toLowerCase().includes(t.toLowerCase()))
      );
    }

    // Date range
    if (fromDate) {
      base = base.filter((d) => d.date && !isBefore(parseISO(d.date), parseISO(fromDate)));
    }
    if (toDate) {
      base = base.filter((d) => d.date && !isAfter(parseISO(d.date), parseISO(toDate)));
    }

    // Sort newest first if dates exist
    base = [...base].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    return base;
  }, [docs, idx, query, selectedTypes, fromDate, toDate]);

  // Infinite scroll intersection observer (after filters computed)
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const canLoadMore = page * PAGE_SIZE < filtered.length;
          if (canLoadMore) setPage((p) => p + 1);
        }
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [page, filtered.length, sentinelRef.current]);

  const visible = filtered.slice(0, page * PAGE_SIZE);

  const toggleType = (t: TypeFilter) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-gradient-to-b from-accent/20 to-background">
        <div className="container py-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Sri Lanka Legal Documents Search
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Fast, client-side search (Lunr.js) across Gazettes, Acts, and Bills. Filter by type and date, then open official PDFs.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div className="relative w-full md:max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search titles, summaries, types…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
                aria-label="Search legal documents"
              />
            </div>
            <div className="md:hidden">
              <Button
                variant="outline"
                onClick={() => setShowFilters((s) => !s)}
                aria-expanded={showFilters}
                aria-controls="filters-panel"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
              </Button>
            </div>
          </div>
          <div id="filters-panel" className={`mt-6 ${showFilters ? 'block' : 'hidden'} md:block`}>
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {DOC_TYPES.map((t) => (
                      <label key={t} className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedTypes.includes(t)}
                          onCheckedChange={() => {
                            toggleType(t);
                            setPage(1);
                          }}
                          aria-label={`Filter ${t}`}
                        />
                        <span className="text-sm">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground">From</label>
                    <Input
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">To</label>
                    <Input
                      type="date"
                      value={toDate}
                      onChange={(e) => {
                        setToDate(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedTypes([]);
                    setFromDate("");
                    setToDate("");
                    setPage(1);
                  }}
                >
                  Clear filters
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <section aria-label="Search results" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
              {loading ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading dataset…</span>
              ) : (
                `${filtered.length} result${filtered.length === 1 ? "" : "s"}`
              )}
            </p>
            {!loading && (
              <Button variant="secondary" onClick={() => setPage(1)}>
                Reset pagination
              </Button>
            )}
          </div>
          {error && (
            <div className="mt-4">
              <Alert variant="destructive" role="alert">
                <AlertTitle>Failed to load data</AlertTitle>
                <AlertDescription className="flex items-start justify-between gap-4">
                  <span>{error}</span>
                  <Button variant="secondary" onClick={() => setReloadKey((k) => k + 1)}>Retry</Button>
                </AlertDescription>
              </Alert>
            </div>
          )}
          <Separator />

          {loading && (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-5 space-y-3">
                    <div className="h-4 w-1/2 bg-muted rounded" />
                    <div className="h-3 w-1/3 bg-muted rounded" />
                    <div className="h-3 w-2/3 bg-muted rounded" />
                    <div className="h-8 w-32 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && visible.length === 0 && (
            <p className="text-muted-foreground">No results. Try adjusting your search or filters.</p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {visible.map((d) => {
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
                            <h2 className="font-semibold leading-snug">{d.title}</h2>
                            <div className="text-xs text-muted-foreground mt-1">
                              <span>{d.type}</span>
                              {d.date && <span className="mx-2">•</span>}
                              {d.date && <time dateTime={d.date}>{format(parseISO(d.date), "PPP")}</time>}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0">
                          <a
                            href={d.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open PDF for ${d.title}`}
                          >
                            <Button variant="default">Open PDF</Button>
                          </a>
                        </div>
                      </div>
                      {d.summary && (
                        <p className="text-sm text-muted-foreground mt-3">
                          {d.summary}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </article>
              );
            })}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} />
        </section>
      </main>

      <footer className="border-t">
        <div className="container py-6 text-xs text-muted-foreground">
          Data source: GitHub nuuuwan/lk_legal_docs (raw JSON). This is a public, client-side search tool.
        </div>
      </footer>
    </div>
  );
};

export default Index;
