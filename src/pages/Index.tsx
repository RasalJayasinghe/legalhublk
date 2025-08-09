import { useEffect, useMemo, useRef, useState } from "react";
import lunr from "lunr";
import { format, parseISO, isAfter, isBefore } from "date-fns";
import { Link, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, ScrollText, Newspaper, Search, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";

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
  rawTypeName: string;
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
    
    return {
      id: raw.id,
      title,
      date: raw.date,
      type: displayType,
      summary: raw.description || '',
      pdfUrl: "",
      rawTypeName: raw.doc_type_name,
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
  
  const [reloadKey, setReloadKey] = useState(0);

  // Sort mode
  const [sortMode, setSortMode] = useState<"newest" | "relevance">("newest");

  // URL search params
  const [searchParams, setSearchParams] = useSearchParams();

  // Search input ref and debounced query for URL sync
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [qSync, setQSync] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setQSync(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  // "What's New" state
  const [newIdSet, setNewIdSet] = useState<Set<string>>(new Set());
  const [showOnlyNew, setShowOnlyNew] = useState(false);
  const [showNewBanner, setShowNewBanner] = useState(false);
  
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
              // @ts-ignore - runtime property on builder
              this.metadataWhitelist = ["position"];
              this.ref("id");
              this.field("title");
              this.field("summary");
              this.field("type");
              normalized.forEach((d) => this.add(d));
            });
            setIdx(built);
            // Compute "new since last visit"
            try {
              const params = new URLSearchParams(window.location.search);
              const forceNew = params.get("forceNew");
              const resetNew = params.get("resetNew");
              const currentIds = Array.from(new Set(normalized.map((d) => d.id)));
              if (resetNew) {
                try { localStorage.removeItem("lh_seen_ids"); } catch {}
              }
              const storedRaw = localStorage.getItem("lh_seen_ids");
              if (!storedRaw) {
                localStorage.setItem("lh_seen_ids", JSON.stringify(currentIds));
                // If forceNew present on first visit, fabricate new set for testing
                if (forceNew) {
                  const sample = currentIds.slice(0, Math.min(currentIds.length, 10));
                  const newSet = new Set<string>(sample);
                  setNewIdSet(newSet);
                  setShowNewBanner(newSet.size > 0);
                } else {
                  setNewIdSet(new Set());
                  setShowNewBanner(false);
                }
              } else {
                const storedArr: string[] = JSON.parse(storedRaw || "[]");
                const storedSet = new Set<string>(storedArr);
                let newIds = currentIds.filter((id) => !storedSet.has(id));
                // If forceNew param, override with a sample to demo
                if (forceNew && newIds.length === 0) {
                  newIds = currentIds.slice(0, Math.min(currentIds.length, 10));
                }
                const newSet = new Set<string>(newIds);
                setNewIdSet(newSet);
                setShowNewBanner(newSet.size > 0);
              }
            } catch {
              try {
                const currentIds = Array.from(new Set(normalized.map((d) => d.id)));
                localStorage.setItem("lh_seen_ids", JSON.stringify(currentIds));
              } catch {}
              setNewIdSet(new Set());
              setShowNewBanner(false);
            }
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

  // URL: hydrate on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || "";
    const types = params.get("types");
    const from = params.get("from") || "";
    const to = params.get("to") || "";
    const sort = params.get("sort") || "newest";
    const onlyNew = params.get("onlyNew") === "1";
    if (q) setQuery(q);
    if (types) setSelectedTypes(types.split(",") as TypeFilter[]);
    if (from) setFromDate(from);
    if (to) setToDate(to);
    setSortMode(sort === "relevance" ? "relevance" : "newest");
    setShowOnlyNew(onlyNew);
  }, []);

  // URL: sync on change (debounced for query)
  useEffect(() => {
    const params = new URLSearchParams();
    if (qSync) params.set("q", qSync);
    if (selectedTypes.length) params.set("types", selectedTypes.join(","));
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    if (sortMode !== "newest") params.set("sort", sortMode);
    if (showOnlyNew) params.set("onlyNew", "1");
    setSearchParams(params, { replace: true });
  }, [qSync, selectedTypes, fromDate, toDate, sortMode, showOnlyNew, setSearchParams]);

  // Keyboard "/" to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Build match position map for highlighting
  const matchPositions = useMemo(() => {
    const map = new Map<string, { title: [number, number][], summary: [number, number][] }>();
    if (!idx || !query.trim()) return map;
    try {
      const results: any[] = idx.search(query.trim()) as any;
      results.forEach((r: any) => {
        const meta = r.matchData?.metadata ?? {};
        const title: [number, number][] = [];
        const summary: [number, number][] = [];
        for (const term of Object.keys(meta)) {
          const fields = meta[term] ?? {};
          if (fields.title?.position) title.push(...fields.title.position);
          if (fields.summary?.position) summary.push(...fields.summary.position);
        }
        if (title.length || summary.length) {
          map.set(r.ref, { title, summary });
        }
      });
    } catch {}
    return map;
  }, [idx, query]);

  type Range = [number, number];
  const mergeRanges = (ranges: Range[]) => {
    if (!ranges || ranges.length === 0) return [] as Range[];
    const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
    const merged: Range[] = [];
    for (const [start, len] of sorted) {
      if (!merged.length) {
        merged.push([start, len]);
      } else {
        const last = merged[merged.length - 1];
        const lastEnd = last[0] + last[1];
        const end = start + len;
        if (start <= lastEnd) {
          last[1] = Math.max(lastEnd, end) - last[0];
        } else {
          merged.push([start, len]);
        }
      }
    }
    return merged;
  };
  const renderHighlighted = (text: string, ranges?: Range[]) => {
    if (!ranges || ranges.length === 0) return text;
    const merged = mergeRanges(ranges);
    const out: JSX.Element[] = [];
    let cursor = 0;
    merged.forEach(([start, len], i) => {
      if (start > cursor) out.push(<span key={`t-${i}-p`}>{text.slice(cursor, start)}</span>);
      out.push(<mark key={`t-${i}-m`}>{text.slice(start, start + len)}</mark>);
      cursor = start + len;
    });
    if (cursor < text.length) out.push(<span key="t-end">{text.slice(cursor)}</span>);
    return <>{out}</>;
  };

  // Date range derived from strings
  const dateRange = useMemo(() => {
    const from = fromDate ? parseISO(fromDate) : undefined;
    const to = toDate ? parseISO(toDate) : undefined;
    if (!from && !to) return undefined;
    return { from, to } as DateRange;
  }, [fromDate, toDate]);

  // Filter + Search
  const filtered = useMemo(() => {
    let base: LegalDocNorm[] = docs;
    let usedLunrOrder = false;

    // Search with lunr if query
    if (idx && query.trim()) {
      try {
        const results = idx.search(query.trim());
        const map = new Map(docs.map((d) => [d.id, d] as const));
        base = results.map((r) => map.get(r.ref)).filter(Boolean) as LegalDocNorm[];
        usedLunrOrder = true;
      } catch {
        // if lunr query fails (e.g., wildcard), fallback simple contains
        const q = query.toLowerCase();
        base = docs.filter((d) =>
          d.title.toLowerCase().includes(q) ||
          d.summary.toLowerCase().includes(q) ||
          d.type.toLowerCase().includes(q)
        );
        usedLunrOrder = false;
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

    // Only show new items if toggled
    if (showOnlyNew && newIdSet.size > 0) {
      base = base.filter((d) => newIdSet.has(d.id));
    }

    // Sort
    if (!(sortMode === "relevance" && query.trim() && usedLunrOrder)) {
      base = [...base].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    }

    return base;
  }, [docs, idx, query, selectedTypes, fromDate, toDate, showOnlyNew, newIdSet, sortMode]);

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

  const [openingId, setOpeningId] = useState<string | null>(null);
  const openPdf = async (d: LegalDocNorm) => {
    try {
      setOpeningId(d.id);
      const year = d.date?.slice(0, 4);
      if (!year) throw new Error('missing-year');
      const metaUrl = `https://raw.githubusercontent.com/nuuuwan/lk_legal_docs/main/data/${d.rawTypeName}/${year}/${d.id}/metadata.json`;
      const res = await fetch(metaUrl, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('meta-not-found');
      const meta = await res.json();
      const m = meta?.lang_to_source_url || {};
      const pdf: string | undefined = m.en || m.si || m.ta || Object.values(m)[0] as string | undefined;
      if (!pdf) throw new Error('no-pdf');
      window.open(pdf, '_blank', 'noopener');
    } catch (e) {
      toast.error('Could not open PDF. It may be temporarily unavailable.');
    } finally {
      setOpeningId(null);
    }
  };
  const handleViewNew = () => {
    setShowOnlyNew(true);
    setPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleMarkSeen = () => {
    try {
      const ids = docs.map((d) => d.id);
      localStorage.setItem("lh_seen_ids", JSON.stringify(ids));
    } catch {}
    setNewIdSet(new Set());
    setShowNewBanner(false);
    setShowOnlyNew(false);
    toast.success("Marked as seen");
  };
  const handleDismissNewBanner = () => {
    setShowNewBanner(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container py-6 md:py-8">
          <div className="grid gap-6 md:grid-cols-12 items-end">
            <div className="md:col-span-7">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                LegalHub LK
              </h1>
              <p className="mt-2 text-muted-foreground max-w-2xl">
                Search Sri Lanka legal documents instantly. Filter and open official PDFs.
              </p>
              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search titles, summaries, types… (Press '/' to focus)"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                  aria-label="Search legal documents"
                />
              </div>
              <div className="mt-3 overflow-x-auto">
                <ToggleGroup
                  type="multiple"
                  variant="outline"
                  size="sm"
                  className="justify-start min-w-max"
                  value={selectedTypes}
                  onValueChange={(vals) => {
                    setSelectedTypes(vals as TypeFilter[]);
                    setPage(1);
                  }}
                  aria-label="Filter by document type"
                >
                  {DOC_TYPES.map((t) => (
                    <ToggleGroupItem key={t} value={t} aria-label={`Filter ${t}`}>
                      {t}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>
            <div className="md:col-span-5">
              <div className="rounded-lg border bg-card p-3 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-muted-foreground">Date Range</label>
                    <Link to="/latest" className="text-sm text-primary hover:underline">
                      Latest →
                    </Link>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "MMM dd, yyyy")} -{" "}
                              {format(dateRange.to, "MMM dd, yyyy")}
                            </>
                          ) : (
                            format(dateRange.from, "MMM dd, yyyy")
                          )
                        ) : (
                          <span>Pick a date range</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={(range) => {
                          if (range?.from) {
                            setFromDate(format(range.from, "yyyy-MM-dd"));
                          } else {
                            setFromDate("");
                          }
                          if (range?.to) {
                            setToDate(format(range.to, "yyyy-MM-dd"));
                          } else {
                            setToDate("");
                          }
                          setPage(1);
                        }}
                        numberOfMonths={2}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="grid gap-6">
          {/* "What's New" Banner */}
          {showNewBanner && newIdSet.size > 0 && (
            <Alert className="border-primary">
              <AlertTitle>New documents available</AlertTitle>
              <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                <span>{newIdSet.size} new document{newIdSet.size === 1 ? "" : "s"} since your last visit.</span>
                <div className="flex items-center gap-2">
                  <Button onClick={handleViewNew}>
                    View {newIdSet.size} new
                  </Button>
                  <Button variant="secondary" onClick={handleMarkSeen}>
                    Mark as seen
                  </Button>
                  <Button variant="ghost" onClick={handleDismissNewBanner}>
                    Dismiss
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Results Count & Sort Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {filtered.length} results
                {(query || selectedTypes.length || fromDate || toDate) && " for filters"}
              </p>
              {!loading && docs.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery("");
                    setSelectedTypes([]);
                    setFromDate("");
                    setToDate("");
                    setShowOnlyNew(false);
                    setPage(1);
                  }}
                  className="h-8"
                >
                  Clear all
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {query.trim() && (
                <ToggleGroup
                  type="single"
                  value={sortMode}
                  onValueChange={(value) => {
                    if (value) setSortMode(value as "newest" | "relevance");
                  }}
                  size="sm"
                >
                  <ToggleGroupItem value="newest" aria-label="Sort by newest">
                    Newest
                  </ToggleGroupItem>
                  <ToggleGroupItem value="relevance" aria-label="Sort by relevance">
                    Relevance
                  </ToggleGroupItem>
                </ToggleGroup>
              )}
              <Badge variant="outline">
                Showing {visible.length} of {filtered.length}
              </Badge>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Failed to load data</AlertTitle>
              <AlertDescription className="flex items-start justify-between gap-4">
                <span>{error}</span>
                <Button variant="secondary" onClick={() => setReloadKey((k) => k + 1)}>Retry</Button>
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Loading State */}
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

          {/* Empty State */}
          {!loading && visible.length === 0 && (
            <p className="text-muted-foreground text-center py-12">
              No results found. Try adjusting your search or filters.
            </p>
          )}

          {/* Document Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {visible.map((d) => {
              const Icon = typeIcon(d.type);
              return (
                <Card key={d.id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-md bg-accent flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-accent-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="space-y-2">
                          <h3 className="font-medium leading-5 line-clamp-2">
                            {renderHighlighted(d.title, matchPositions.get(d.id)?.title)}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {renderHighlighted(d.summary, matchPositions.get(d.id)?.summary)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{d.type}</Badge>
                            {newIdSet.has(d.id) && <Badge>New</Badge>}
                          </div>
                          <time className="text-xs text-muted-foreground">
                            {d.date ? format(parseISO(d.date), "MMM dd, yyyy") : ""}
                          </time>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => openPdf(d)}
                        disabled={openingId === d.id}
                        size="sm"
                      >
                        {openingId === d.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Opening...
                          </>
                        ) : (
                          'Open PDF'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Load More / Infinite Scroll */}
          {visible.length < filtered.length && (
            <div className="text-center space-y-4">
              <div ref={sentinelRef} className="h-4" />
              <Button
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                className="min-w-[120px]"
              >
                Load more ({filtered.length - visible.length} remaining)
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;