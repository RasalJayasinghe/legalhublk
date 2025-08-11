import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface LegalDocRaw {
  doc_type_name: string;
  id: string;
  date: string;
  description: string;
}

export interface LegalDocNorm {
  id: string;
  title: string;
  date: string;
  type: string;
  summary: string;
  pdfUrl: string;
  rawTypeName: string;
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
}

const DATA_URLS = [
  "https://raw.githubusercontent.com/nuuuwan/lk_legal_docs/main/data/all.json",
];

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

async function fetchDocumentCount(): Promise<number> {
  try {
    for (const url of DATA_URLS) {
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

async function fetchDocuments(
  onProgress?: (stage: string, progress: number, processed?: number, total?: number) => void
): Promise<{ docs: LegalDocNorm[], stats: SyncState['documentStats'] }> {
  onProgress?.("Fetching latest documents...", 10);
  
  const stats = { fetched: 0, processed: 0, filtered: 0 };
  
  for (const url of DATA_URLS) {
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
    documentStats: { fetched: 0, processed: 0, filtered: 0 }
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

        if (currentCount > cachedDocs.length) {
          toast.info(`${currentCount - cachedDocs.length} new documents available. Click refresh to update.`);
        }

        isLoadingRef.current = false;
        return;
      }

      // Fetch fresh data
      const { docs, stats } = await fetchDocuments(updateProgress);
      const seenIds = getSeenIds();
      const newDocs = docs.filter(doc => !seenIds.has(doc.id)).slice(0, 50);

      // Cache the results
      setCachedDocs(docs);

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
        documentStats: stats
      }));

      if (newDocs.length > 0) {
        toast.success(`Found ${newDocs.length} new documents!`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync documents';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        loadingStage: "Error",
        loadingProgress: 0
      }));
      toast.error(errorMessage);
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
    markDocumentsAsSeen(allIds);
    toast.success('All documents marked as seen');
  }, [state.docs, markDocumentsAsSeen]);

  const refreshData = useCallback(() => {
    syncDocuments(true);
  }, [syncDocuments]);

  // Initial load and setup interval
  useEffect(() => {
    syncDocuments();

    // Setup automatic sync every hour
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
    refreshData,
    markDocumentsAsSeen,
    markAllAsSeen
  };
}