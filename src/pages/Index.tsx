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
import { FileText, ScrollText, Newspaper, Search, Loader2, Calendar as CalendarIcon, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ShareButton } from "@/components/share-button";
import { DocumentSkeleton } from "@/components/document-skeleton";
import { LoadingProgress } from "@/components/loading-progress";
import { Brand } from "@/components/brand";
import { TypewriterInput } from "@/components/typewriter-input";
import { InterestPopup } from "@/components/interest-popup";
import { SyncStatus } from "@/components/sync-status";
import { NewDocumentsBanner } from "@/components/new-documents-banner";
import { useDocumentSync, type LegalDocNorm } from "@/hooks/useDocumentSync";
import type { DateRange } from "react-day-picker";

const PAGE_SIZE = 20;
const DOC_TYPES = ["Gazette", "Extraordinary Gazette", "Act", "Bill"] as const;

type TypeFilter = typeof DOC_TYPES[number];

function typeIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes("act")) return ScrollText;
  if (t.includes("bill")) return FileText;
  return Newspaper;
}

const Index = () => {
  // Use the new document sync hook
  const {
    docs,
    loading,
    error,
    lastUpdated,
    totalDocuments,
    processedDocuments,
    loadingStage,
    loadingProgress,
    newDocuments,
    hasNewDocuments,
    documentStats,
    refreshData,
    markAllAsSeen
  } = useDocumentSync();

  const [query, setQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<TypeFilter[]>([]);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [page, setPage] = useState(1);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [idx, setIdx] = useState<lunr.Index | null>(null);
  const [dateFilter, setDateFilter] = useState<"all" | "this-year" | "last-year" | "last-2-years">("all");
  const [showNewBanner, setShowNewBanner] = useState(true);
  const [showOnlyNew, setShowOnlyNew] = useState(false);

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

  // Build lunr search index when docs change
  useEffect(() => {
    if (docs.length > 0) {
      const built = lunr(function () {
        // @ts-ignore - runtime property on builder
        this.metadataWhitelist = ["position"];
        this.ref("id");
        this.field("title");
        this.field("summary");
        this.field("type");
        docs.forEach((d) => this.add(d));
      });
      setIdx(built);
    }
  }, [docs]);

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
    if (showOnlyNew && newDocuments.length > 0) {
      const newIds = new Set(newDocuments.map(d => d.id));
      base = base.filter((d) => newIds.has(d.id));
    }

    // Sort
    if (!(sortMode === "relevance" && query.trim() && usedLunrOrder)) {
      base = [...base].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    }

    return base;
  }, [docs, idx, query, selectedTypes, fromDate, toDate, showOnlyNew, newDocuments, sortMode]);

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
  }, [page, filtered.length]);

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

  const handleDismissNewBanner = () => {
    setShowNewBanner(false);
  };

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Interest popup state
  const [showInterestPopup, setShowInterestPopup] = useState(false);
  const [siteStartTime] = useState(Date.now());
  const popupShownRef = useRef(false);

  // Interest popup logic
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forceInterest = params.get("forceInterest") === "1";

    const response = localStorage.getItem("legalhub-interest-response");
    const expiry = localStorage.getItem("legalhub-interest-expiry");

    if (!forceInterest) {
      // Never show again if user said "never"
      if (response === "never") return;

      // Respect temporary expiry (30 days)
      if (response && expiry) {
        const expiryDate = new Date(expiry);
        if (new Date() < expiryDate) return;
      }
    }

    const showNow = () => {
      if (popupShownRef.current) return;
      popupShownRef.current = true;
      setShowInterestPopup(true);
      window.removeEventListener("scroll", onScroll as any);
    };

    const onScroll = () => {
      const seconds = Math.floor((Date.now() - siteStartTime) / 1000);
      if (window.scrollY > 400 && seconds >= 8) {
        showNow();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true } as any);
    const timer = window.setTimeout(showNow, 20000);

    return () => {
      window.removeEventListener("scroll", onScroll as any);
      clearTimeout(timer);
    };
  }, [siteStartTime]);

  const handleCloseInterestPopup = () => {
    setShowInterestPopup(false);
  };

  const getTimeOnSite = () => {
    return Math.floor((Date.now() - siteStartTime) / 1000);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-sm supports-[backdrop-filter]:bg-background/50">
        <div className="container max-w-7xl py-2">
          {/* Mobile Header - Compact */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-2">
              <Brand className="shrink-0" />
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="h-8 w-8 p-0"
                  aria-label="Toggle search and filters"
                >
                  {showMobileFilters ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                </Button>
                <ShareButton />
                <ThemeToggle />
              </div>
            </div>

            {/* Mobile Expandable Search & Filters */}
            {showMobileFilters && (
              <div className="space-y-3 pb-2">
                {/* Mobile Search Bar */}
                <TypewriterInput
                  value={query}
                  onChange={setQuery}
                  onPage={setPage}
                  placeholder="Search documents…"
                  className="h-9"
                  inputRef={searchInputRef}
                />

                {/* Mobile Filters */}
                <div className="space-y-2">
                  {/* Type Filters Dropdown */}
                  <Select 
                    value={selectedTypes.length === 1 ? selectedTypes[0] : selectedTypes.length > 1 ? "multiple" : "all"} 
                    onValueChange={(value) => {
                      if (value === "all") {
                        setSelectedTypes([]);
                      } else if (value === "multiple") {
                        // Keep current selection
                        return;
                      } else {
                        setSelectedTypes([value as TypeFilter]);
                      }
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder={
                        selectedTypes.length === 0 ? "All document types" : 
                        selectedTypes.length === 1 ? selectedTypes[0] :
                        `${selectedTypes.length} types selected`
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All document types</SelectItem>
                      {DOC_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Date Filter */}
                  <Select value={dateFilter} onValueChange={(value) => {
                    setDateFilter(value as "all" | "this-year" | "last-year" | "last-2-years");
                    // Set date range based on selection
                    const now = new Date();
                    const currentYear = now.getFullYear();
                    if (value === "all") {
                      setFromDate("");
                      setToDate("");
                    } else if (value === "this-year") {
                      setFromDate(`${currentYear}-01-01`);
                      setToDate("");
                    } else if (value === "last-year") {
                      setFromDate(`${currentYear - 1}-01-01`);
                      setToDate(`${currentYear - 1}-12-31`);
                    } else if (value === "last-2-years") {
                      setFromDate(`${currentYear - 2}-01-01`);
                      setToDate("");
                    }
                    setPage(1);
                  }}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="All dates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All dates</SelectItem>
                      <SelectItem value="this-year">This year</SelectItem>
                      <SelectItem value="last-year">Last year</SelectItem>
                      <SelectItem value="last-2-years">Last 2 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Header - Full Layout */}
          <div className="hidden md:block">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2">
                <Brand className="shrink-0" />
                <h1 className="sr-only">LegalHub LK — Sri Lankan Legal Document Search</h1>
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
                <ShareButton />
                <ThemeToggle />
              </div>
            </div>

            {/* Desktop Tagline */}
            <p className="text-muted-foreground max-w-2xl mb-4 text-sm md:text-base">
              Every Gazette, Act & Bill — in one place.
            </p>

            {/* Desktop Search Section */}
            <div className="space-y-3">
              {/* Search Bar */}
              <TypewriterInput
                value={query}
                onChange={setQuery}
                onPage={setPage}
                placeholder="Search documents… (Press '/' to focus)"
                className="h-9"
                inputRef={searchInputRef}
              />

              {/* Filters Row */}
              <div className="flex flex-row gap-3">
                {/* Type Filters */}
                <div className="flex-1">
                  <ToggleGroup
                    type="multiple"
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2"
                    value={selectedTypes}
                    onValueChange={(vals) => {
                      setSelectedTypes(vals as TypeFilter[]);
                      setPage(1);
                    }}
                    aria-label="Filter by document type"
                  >
                    {DOC_TYPES.map((t) => (
                      <ToggleGroupItem 
                        key={t} 
                        value={t} 
                        aria-label={`Filter ${t}`}
                        className="text-sm px-3 h-8"
                      >
                        {t}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>

                {/* Date Range */}
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start text-left font-normal h-8 px-3"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span className="text-sm">
                          {dateRange?.from ? (
                            dateRange.to ? (
                              <>
                                {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                              </>
                            ) : (
                              format(dateRange.from, "MMM dd, yyyy")
                            )
                          ) : (
                            "Pick date range"
                          )}
                        </span>
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

                {/* Latest Link */}
                <Link 
                  to="/latest" 
                  className="text-sm text-primary hover:underline whitespace-nowrap self-center"
                >
                  Latest →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6">
        <div className="grid gap-6">
          {/* New Documents Banner */}
          <NewDocumentsBanner
            newDocumentsCount={newDocuments.length}
            onDismiss={handleDismissNewBanner}
            onMarkAllSeen={markAllAsSeen}
            visible={showNewBanner && hasNewDocuments}
          />

          {/* Results Count & Sort Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {filtered.length} results
                {(query || selectedTypes.length || fromDate || toDate) && " for filters"}
              </p>
              {!loading && docs.length > 0 && (
                <div className="flex items-center gap-2">
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
                </div>
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
                <Button variant="secondary" onClick={refreshData}>Retry</Button>
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Loading State */}
          {loading && (
            <LoadingProgress
              stage={loadingStage}
              progress={loadingProgress}
              totalDocuments={totalDocuments}
              processedDocuments={processedDocuments}
            />
          )}

          {/* Empty State */}
          {!loading && visible.length === 0 && (
            <p className="text-muted-foreground text-center py-12">
              No results found. Try adjusting your search or filters.
            </p>
          )}

          {/* Document Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {visible.map((d, index) => {
              const Icon = typeIcon(d.type);
              const isNew = newDocuments.some(newDoc => newDoc.id === d.id);
              return (
                <Card 
                  key={d.id} 
                  className="group hover:shadow-md transition-all duration-200 hover:scale-[1.02] animate-fade-in"
                  style={{ animationDelay: `${(index % PAGE_SIZE) * 50}ms` }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 animate-scale-in">
                      <div className="h-10 w-10 rounded-md bg-accent flex items-center justify-center shrink-0 transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="space-y-2 animate-slide-up" style={{ animationDelay: `${(index % PAGE_SIZE) * 30 + 100}ms` }}>
                          <h3 className="font-medium leading-5 line-clamp-2">
                            {renderHighlighted(d.title, matchPositions.get(d.id)?.title)}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {renderHighlighted(d.summary, matchPositions.get(d.id)?.summary)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-3 animate-slide-up" style={{ animationDelay: `${(index % PAGE_SIZE) * 30 + 200}ms` }}>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{d.type}</Badge>
                            {isNew && <Badge>New</Badge>}
                          </div>
                          <time className="text-xs text-muted-foreground">
                            {d.date ? format(parseISO(d.date), "MMM dd, yyyy") : ""}
                          </time>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end animate-slide-up" style={{ animationDelay: `${(index % PAGE_SIZE) * 30 + 300}ms` }}>
                      <Button
                        onClick={() => openPdf(d)}
                        disabled={openingId === d.id}
                        size="sm"
                        className="transition-all duration-200 hover:scale-105"
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

      {/* Interest Validation Popup */}
      <InterestPopup
        isOpen={showInterestPopup}
        onClose={handleCloseInterestPopup}
        timeOnSite={getTimeOnSite()}
      />
    </div>
  );
};

export default Index;
