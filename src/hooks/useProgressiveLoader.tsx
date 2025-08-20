import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { LegalDocRaw, LegalDocNorm } from './useDocumentSync';

const CHUNK_SIZE = 1000;
const INITIAL_LOAD_SIZE = 50;

export interface ProgressiveLoaderState {
  docs: LegalDocNorm[];
  loading: boolean;
  initialLoadComplete: boolean;
  totalProgress: number;
  processedCount: number;
  totalCount: number;
  error: string | null;
}

export function useProgressiveLoader() {
  const [state, setState] = useState<ProgressiveLoaderState>({
    docs: [],
    loading: false,
    initialLoadComplete: false,
    totalProgress: 0,
    processedCount: 0,
    totalCount: 0,
    error: null
  });

  const processingRef = useRef(false);
  const workerRef = useRef<Worker | null>(null);

  // Initialize Web Worker
  useEffect(() => {
    const workerCode = `
      function normalize(raw) {
        try {
          const date = new Date(raw.date);
          if (isNaN(date.getTime())) return null;
          
          const typeMap = {
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

      self.onmessage = function(e) {
        const { chunk, chunkIndex, isLast } = e.data;
        const processed = [];
        let filtered = 0;
        
        for (const raw of chunk) {
          const normalized = normalize(raw);
          if (normalized) {
            processed.push(normalized);
          } else {
            filtered++;
          }
        }
        
        self.postMessage({
          processed,
          filtered,
          chunkIndex,
          isLast
        });
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    workerRef.current = new Worker(workerUrl);

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        URL.revokeObjectURL(workerUrl);
      }
    };
  }, []);

  const loadDocumentsProgressive = useCallback(async (forceRefresh = false) => {
    if (processingRef.current) return;
    
    processingRef.current = true;
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      totalProgress: 0,
      processedCount: 0
    }));

    try {
      // Check cache first
      const cachedData = localStorage.getItem('lh_documents_cache_progressive');
      const lastSync = localStorage.getItem('lh_last_sync');
      const now = Date.now();
      const HOUR = 60 * 60 * 1000;

      if (!forceRefresh && cachedData && lastSync) {
        const cacheTime = new Date(lastSync).getTime();
        if (now - cacheTime < HOUR) {
          const cached = JSON.parse(cachedData);
          setState(prev => ({
            ...prev,
            docs: cached.slice(0, INITIAL_LOAD_SIZE),
            loading: false,
            initialLoadComplete: true,
            totalProgress: 100,
            processedCount: cached.length,
            totalCount: cached.length
          }));

          // Load remaining docs in background
          setTimeout(() => {
            setState(prev => ({ ...prev, docs: cached }));
          }, 100);

          processingRef.current = false;
          return;
        }
      }

      // Fetch fresh data
      const response = await fetch(
        `https://raw.githubusercontent.com/nuuuwan/lk_legal_docs/main/data/all.json?t=${now}`,
        {
          headers: { Accept: "application/json" },
          cache: "no-store"
        }
      );

      if (!response.ok) throw new Error('Failed to fetch documents');
      
      const rawDocs: LegalDocRaw[] = await response.json();
      setState(prev => ({ 
        ...prev, 
        totalCount: rawDocs.length,
        totalProgress: 10
      }));

      // Process in chunks
      const allProcessed: LegalDocNorm[] = [];
      const chunks = [];
      for (let i = 0; i < rawDocs.length; i += CHUNK_SIZE) {
        chunks.push(rawDocs.slice(i, i + CHUNK_SIZE));
      }

      let completedChunks = 0;

      return new Promise<void>((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not available'));
          return;
        }

        workerRef.current.onmessage = (e) => {
          const { processed, chunkIndex, isLast } = e.data;
          
          allProcessed.push(...processed);
          completedChunks++;
          
          const progress = 10 + (completedChunks / chunks.length) * 80;
          
          setState(prev => ({
            ...prev,
            totalProgress: progress,
            processedCount: allProcessed.length
          }));

          // Show initial batch immediately
          if (completedChunks === 1) {
            const sorted = [...allProcessed].sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            setState(prev => ({
              ...prev,
              docs: sorted.slice(0, INITIAL_LOAD_SIZE),
              initialLoadComplete: true
            }));
          }

          // Update with more docs progressively
          if (completedChunks % 3 === 0 || isLast) {
            const sorted = [...allProcessed].sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            setState(prev => ({ ...prev, docs: sorted }));
          }

          if (isLast) {
            // Final update
            const sorted = [...allProcessed].sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            
            setState(prev => ({
              ...prev,
              docs: sorted,
              loading: false,
              totalProgress: 100
            }));

            // Cache results with quota handling
            try {
              // Only cache a subset to prevent quota exceeded errors
              const cacheData = sorted.slice(0, 100); // Cache first 100 docs only
              localStorage.setItem('lh_documents_cache_progressive', JSON.stringify(cacheData));
              localStorage.setItem('lh_last_sync', new Date().toISOString());
            } catch (error) {
              console.warn('Could not cache documents due to storage quota:', error.message);
              // Clear any existing cache if quota exceeded
              try {
                localStorage.removeItem('lh_documents_cache_progressive');
                localStorage.removeItem('lh_last_sync');
              } catch {}
            }

            processingRef.current = false;
            resolve();
          }
        };

        workerRef.current.onerror = (error) => {
          reject(error);
        };

        // Send chunks to worker
        chunks.forEach((chunk, index) => {
          workerRef.current!.postMessage({
            chunk,
            chunkIndex: index,
            isLast: index === chunks.length - 1
          });
        });
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load documents';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        totalProgress: 0
      }));
      toast.error(errorMessage);
      processingRef.current = false;
    }
  }, []);

  return {
    ...state,
    loadDocuments: loadDocumentsProgressive
  };
}