import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface LegalDocRaw {
  doc_type_name: string;
  id: string;
  date: string;
  description: string;
  // Enhanced fields for Hugging Face datasets
  full_content?: string;
  chunk_content?: string;
  metadata?: Record<string, any>;
  chunk_metadata?: Record<string, any>;
}

export interface LegalDocNorm {
  id: string;
  title: string;
  date: string;
  type: string;
  summary: string;
  pdfUrl: string;
  rawTypeName: string;
  // Enhanced fields for rich content
  full_content?: string;
  chunk_content?: string;
  metadata?: Record<string, any>;
  chunk_metadata?: Record<string, any>;
  hasFullContent?: boolean;
  isChunk?: boolean;
}

export interface SyncState {
  docs: LegalDocNorm[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  totalDocuments: number;
  processedDocuments: number;
  loadingStage: string;
  loadingProgress: number;
  newDocuments: LegalDocNorm[];
  hasNewDocuments: boolean;
  documentStats: {
    fetched: number;
    processed: number;
    filtered: number;
  };
  // GitHub source info for proof of latest sync
  gitCommitSha: string | null;
  gitCommitDate: string | null;
  gitCommitUrl: string | null;
}

// Local data URLs - served from public/data directory
const LOCAL_DATA_URLS = [
  '/data/gazettes/latest.json',
  '/data/extra-gazettes/latest.json',
  '/data/acts/latest.json',
  '/data/bills/latest.json',
  '/data/forms/latest.json',
  '/data/notices/latest.json',
  '/data/hf-acts-full/latest.json',
  '/data/hf-acts-chunks/latest.json',
  '/data/github-acts/latest.json',
  '/data/github-extraordinary-gazettes/latest.json',
  '/data/github-bills/latest.json',
  '/data/all/latest.json' // Merged structure
];

// Currently no working remote URLs - data should be generated locally by GitHub Actions
const REMOTE_DATA_URLS: string[] = [];

const SYNC_INTERVAL = 60 * 60 * 1000; // 1 hour
const STORAGE_KEYS = {
  DOCS: 'lh_documents_cache',
  LAST_SYNC: 'lh_last_sync',
  SEEN_IDS: 'lh_seen_ids',
  DOCUMENT_COUNT: 'lh_document_count'
};

function normalize(raw: LegalDocRaw): LegalDocNorm | null {
  try {
    const date = new Date(raw.date);
    if (isNaN(date.getTime())) return null;
    
    const typeMap: Record<string, string> = {
      'acts': 'Act',
      'bills': 'Bill', 
      'forms': 'Form',
      'notices': 'Notice',
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
      // Enhanced content fields
      full_content: raw.full_content,
      chunk_content: raw.chunk_content,
      metadata: raw.metadata,
      chunk_metadata: raw.chunk_metadata,
      hasFullContent: Boolean(raw.full_content),
      isChunk: Boolean(raw.chunk_content)
    };
  } catch {
    return null;
  }
}

async function fetchDocumentCount(): Promise<number> {
  try {
    for (const url of REMOTE_DATA_URLS) {
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-store'
      });
      
      if (response.ok) {
        // If HEAD doesn't work, do a quick fetch to get count
        const fullResponse = await fetch(url, { 
          cache: 'no-store',
          headers: { Accept: 'application/json' }
        });
        const data = await fullResponse.json();
        const arr: LegalDocRaw[] = Array.isArray(data) ? data : data?.items || data?.docs || [];
        return arr.length;
      }
    }
    return 0;
  } catch {
    return 0;
  }
}

async function fetchLocalDocuments(): Promise<{ catalog: LegalDocNorm[]; latest: LegalDocNorm[] }> {
  try {
    const allDocs: LegalDocNorm[] = [];
    let foundAny = false;
    
    // Fetch from all local data sources
    for (const url of LOCAL_DATA_URLS) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const docs = data.documents || [];
          allDocs.push(...docs);
          foundAny = true;
        }
      } catch (error) {
        // Continue with other sources
        continue;
      }
    }
    
    if (foundAny) {
      // Remove duplicates by ID and sort by date
      const uniqueDocs = new Map<string, LegalDocNorm>();
      allDocs.forEach(doc => {
        const existing = uniqueDocs.get(doc.id);
        if (!existing || doc.date > existing.date) {
          uniqueDocs.set(doc.id, doc);
        }
      });
      
      const sortedDocs = Array.from(uniqueDocs.values())
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return {
        catalog: sortedDocs,
        latest: sortedDocs.slice(0, 300) // Latest subset
      };
    }
  } catch (error) {
    console.warn('Failed to fetch local documents:', error);
  }
  
  // Fallback to empty arrays if local files are not available
  return { catalog: [], latest: [] };
}

async function fetchRemoteDocuments(
  onProgress?: (stage: string, progress: number, processed?: number, total?: number) => void
): Promise<{ docs: LegalDocNorm[], stats: SyncState['documentStats'] }> {
  onProgress?.("Fetching remote documents...", 10);
  
  const stats = { fetched: 0, processed: 0, filtered: 0 };
  
  for (const url of REMOTE_DATA_URLS) {
    try {
      const cacheBustUrl = `${url}?t=${Date.now()}`;
      const response = await fetch(cacheBustUrl, {
        headers: { Accept: "application/json" },
        cache: "no-store",
        mode: "cors",
      });
      
      if (!response.ok) continue;
      
      onProgress?.("Processing document data...", 30);
      
      const data = await response.json();
      const rawDocs: LegalDocRaw[] = Array.isArray(data) ? data : data?.items || data?.docs || [];
      
      stats.fetched = rawDocs.length;
      onProgress?.("Normalizing documents...", 50);
      
      const docs: LegalDocNorm[] = [];
      
      for (let i = 0; i < rawDocs.length; i++) {
        const normalized = normalize(rawDocs[i]);
        if (normalized) {
          docs.push(normalized);
          stats.processed++;
        } else {
          stats.filtered++;
        }
        
        if (i % 1000 === 0) {
          onProgress?.("Processing documents...", 50 + (i / rawDocs.length) * 40, i, rawDocs.length);
        }
      }
      
      onProgress?.("Finalizing...", 95);
      
      // Sort by date (newest first)
      docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      onProgress?.("Complete", 100);
      
      return { docs, stats };
    } catch (error) {
      console.error('Error fetching documents:', error);
      continue;
    }
  }
  
  throw new Error('Failed to fetch documents from any source');
}

async function fetchDocuments(
  onProgress?: (stage: string, progress: number, processed?: number, total?: number) => void
): Promise<{ docs: LegalDocNorm[], stats: SyncState['documentStats'] }> {
  onProgress?.("Checking local data...", 5);
  
  // Try local files first (from GitHub Actions sync)
  const { catalog, latest } = await fetchLocalDocuments();
  
  if (catalog.length > 0) {
    onProgress?.("Using local data", 100);
    const stats = { 
      fetched: catalog.length, 
      processed: catalog.length, 
      filtered: 0 
    };
    return { docs: catalog, stats };
  }
  
  // No remote sources available - return empty data
  console.log('Local data not available. Data will be generated when GitHub Actions run.');
  
  const stats = { fetched: 0, processed: 0, filtered: 0 };
  return { docs: [], stats };
}

function getSeenIds(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SEEN_IDS);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
}

function setSeenIds(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SEEN_IDS, JSON.stringify(ids));
  } catch {
    // Handle storage errors gracefully
  }
}

function getCachedDocs(): LegalDocNorm[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DOCS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setCachedDocs(docs: LegalDocNorm[]) {
  try {
    // Don't limit cache size anymore - store all documents
    localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(docs));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch {
    // Handle storage errors gracefully
  }
}

function getLastSync(): Date | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    return stored ? new Date(stored) : null;
  } catch {
    return null;
  }
}

export function useDocumentSync() {
  const [state, setState] = useState<SyncState>({
    docs: [],
    loading: true,
    error: null,
    lastUpdated: null,
    totalDocuments: 0,
    processedDocuments: 0,
    loadingStage: "",
    loadingProgress: 0,
    newDocuments: [],
    hasNewDocuments: false,
    documentStats: { fetched: 0, processed: 0, filtered: 0 },
    gitCommitSha: null,
    gitCommitDate: null,
    gitCommitUrl: null
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const isLoadingRef = useRef(false);

  const updateProgress = useCallback((stage: string, progress: number, processed?: number, total?: number) => {
    setState(prev => ({
      ...prev,
      loadingStage: stage,
      loadingProgress: progress,
      processedDocuments: processed || prev.processedDocuments,
      totalDocuments: total || prev.totalDocuments
    }));
  }, []);

  const syncDocuments = useCallback(async (forceRefresh = false) => {
    if (isLoadingRef.current) return;
    
    isLoadingRef.current = true;
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      loadingStage: "Starting sync...",
      loadingProgress: 0
    }));

    try {
      // Check if we need to fetch new data
      const lastSync = getLastSync();
      const cachedDocs = getCachedDocs();
      const now = new Date();
      const shouldFetch = forceRefresh || 
        !lastSync || 
        cachedDocs.length === 0 || 
        (now.getTime() - lastSync.getTime()) > SYNC_INTERVAL;

      if (!shouldFetch && cachedDocs.length > 0) {
        // Use cached data but still check for count differences
        const currentCount = await fetchDocumentCount();
        const seenIds = getSeenIds();
        const newDocs = cachedDocs.filter(doc => !seenIds.has(doc.id)).slice(0, 50);
        
      setState(prev => ({
        ...prev,
        docs: cachedDocs,
        loading: false,
        lastUpdated: lastSync,
        totalDocuments: cachedDocs.length,
        processedDocuments: cachedDocs.length,
        newDocuments: newDocs,
        hasNewDocuments: newDocs.length > 0,
        loadingStage: "Using cached data",
        loadingProgress: 100,
        documentStats: { 
          fetched: cachedDocs.length, 
          processed: cachedDocs.length, 
          filtered: 0 
        }
      }));

        const hasRemoteNew = currentCount > cachedDocs.length;
        if (hasRemoteNew) {
          toast.info(`${currentCount - cachedDocs.length} new documents available. Syncing now…`);
          // Continue to fetch fresh data below without returning
        } else {
          isLoadingRef.current = false;
          return;
        }
      }

      // Fetch fresh data
      const { docs: fetchedDocs, stats } = await fetchDocuments(updateProgress);
      let docs = fetchedDocs;

      // Skip augmentation - we already have all data from local sources
      updateProgress("Complete", 95);

      const seenIds = getSeenIds();
      const newDocs = docs.filter((doc) => !seenIds.has(doc.id)).slice(0, 50);

      // Fetch latest commit info for proof
      let gitCommitSha: string | null = null;
      let gitCommitUrl: string | null = null;
      let gitCommitDate: string | null = null;
      try {
        const commitRes = await fetch(
          'https://api.github.com/repos/nuuuwan/lk_legal_docs/commits?path=data/all.json&per_page=1',
          { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' }
        );
        if (commitRes.ok) {
          const arr = await commitRes.json();
          const latest = Array.isArray(arr) ? arr[0] : null;
          if (latest) {
            gitCommitSha = latest.sha || null;
            gitCommitUrl = latest.html_url || null;
            gitCommitDate = latest.commit?.committer?.date || latest.commit?.author?.date || null;
          }
        }
      } catch {}

      // Cache the results
      setCachedDocs(docs);

      // Sync complete toast (generic, no provider names)
      const prevCount = cachedDocs.length;
      const delta = docs.length - prevCount;
      toast.success(`Synced latest documents: ${prevCount.toLocaleString()} -> ${docs.length.toLocaleString()} (${delta >= 0 ? '+' : ''}${delta})`);

      setState(prev => ({
        ...prev,
        docs,
        loading: false,
        error: null,
        lastUpdated: now,
        totalDocuments: docs.length,
        processedDocuments: docs.length,
        newDocuments: newDocs,
        hasNewDocuments: newDocs.length > 0,
        loadingStage: "Complete",
        loadingProgress: 100,
        documentStats: stats,
        gitCommitSha,
        gitCommitDate,
        gitCommitUrl
      }));

    } catch (error: any) {
      console.error('Sync error:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error?.message || 'Failed to sync documents',
        loadingStage: "Error",
        loadingProgress: 0
      }));
      
      toast.error(`Failed to sync documents: ${error?.message || 'Unknown error'}`);
    } finally {
      isLoadingRef.current = false;
    }
  }, [updateProgress]);

  const markDocumentsAsSeen = useCallback((docIds: string[]) => {
    const seenIds = getSeenIds();
    docIds.forEach(id => seenIds.add(id));
    setSeenIds(Array.from(seenIds));
    
    setState(prev => ({
      ...prev,
      newDocuments: prev.newDocuments.filter(doc => !docIds.includes(doc.id)),
      hasNewDocuments: prev.newDocuments.filter(doc => !docIds.includes(doc.id)).length > 0
    }));
  }, []);

  const markAllAsSeen = useCallback(() => {
    const allIds = state.docs.map(doc => doc.id);
    setSeenIds(allIds);
    
    setState(prev => ({
      ...prev,
      newDocuments: [],
      hasNewDocuments: false
    }));
  }, [state.docs]);

  const refreshData = useCallback(() => {
    syncDocuments(true);
  }, [syncDocuments]);

  // Initial sync and periodic updates
  useEffect(() => {
    syncDocuments();

    // Set up interval for auto-sync
    intervalRef.current = setInterval(() => {
      syncDocuments();
    }, SYNC_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [syncDocuments]);

  return {
    ...state,
    syncDocuments,
    markDocumentsAsSeen,
    markAllAsSeen,
    refreshData
  };
}