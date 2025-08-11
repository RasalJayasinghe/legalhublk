import { useState, useEffect, useMemo, useRef } from 'react';
import lunr from 'lunr';
import type { LegalDocNorm } from './useDocumentSync';

export interface SearchResult {
  doc: LegalDocNorm;
  highlights: {
    title: [number, number][];
    summary: [number, number][];
  };
}

export function useLazySearch(docs: LegalDocNorm[]) {
  const [searchIndex, setSearchIndex] = useState<lunr.Index | null>(null);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexingProgress, setIndexingProgress] = useState(0);
  const workerRef = useRef<Worker | null>(null);

  // Build search index lazily with Web Worker
  const buildSearchIndex = useMemo(() => {
    return async () => {
      if (docs.length === 0 || searchIndex || isIndexing) return;
      
      setIsIndexing(true);
      setIndexingProgress(0);

      try {
        // Create worker for search index building
        const workerCode = `
          importScripts('https://unpkg.com/lunr@2.3.9/lunr.min.js');
          
          self.onmessage = function(e) {
            const { docs } = e.data;
            
            try {
              const index = lunr(function () {
                this.metadataWhitelist = ["position"];
                this.ref("id");
                this.field("title");
                this.field("summary");
                this.field("type");
                
                docs.forEach((doc, i) => {
                  this.add(doc);
                  if (i % 1000 === 0) {
                    self.postMessage({ type: 'progress', progress: (i / docs.length) * 100 });
                  }
                });
              });
              
              self.postMessage({ 
                type: 'complete', 
                indexData: JSON.stringify(index) 
              });
            } catch (error) {
              self.postMessage({ 
                type: 'error', 
                error: error.message 
              });
            }
          };
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);
        workerRef.current = worker;

        return new Promise<void>((resolve, reject) => {
          worker.onmessage = (e) => {
            const { type, progress, indexData, error } = e.data;
            
            if (type === 'progress') {
              setIndexingProgress(progress);
            } else if (type === 'complete') {
              const index = lunr.Index.load(JSON.parse(indexData));
              setSearchIndex(index);
              setIsIndexing(false);
              setIndexingProgress(100);
              worker.terminate();
              URL.revokeObjectURL(workerUrl);
              resolve();
            } else if (type === 'error') {
              setIsIndexing(false);
              setIndexingProgress(0);
              worker.terminate();
              URL.revokeObjectURL(workerUrl);
              reject(new Error(error));
            }
          };

          worker.onerror = (error) => {
            setIsIndexing(false);
            setIndexingProgress(0);
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            reject(error);
          };

          worker.postMessage({ docs });
        });

      } catch (error) {
        setIsIndexing(false);
        setIndexingProgress(0);
        console.error('Search index building failed:', error);
      }
    };
  }, [docs, searchIndex, isIndexing]);

  // Auto-build index when docs are loaded
  useEffect(() => {
    if (docs.length > 0 && !searchIndex && !isIndexing) {
      buildSearchIndex();
    }
  }, [docs.length, searchIndex, isIndexing, buildSearchIndex]);

  // Search function
  const search = useMemo(() => {
    return (query: string): SearchResult[] => {
      if (!searchIndex || !query.trim()) return [];

      try {
        const results = searchIndex.search(query.trim());
        const docMap = new Map(docs.map(d => [d.id, d]));
        
        return results.map(result => {
          const doc = docMap.get(result.ref);
          if (!doc) return null;

          // Extract highlights from metadata
          const highlights = { title: [], summary: [] };
          const metadata = (result as any).matchData?.metadata || {};
          
          for (const term of Object.keys(metadata)) {
            const fields = metadata[term] || {};
            if (fields.title?.position) {
              highlights.title.push(...fields.title.position);
            }
            if (fields.summary?.position) {
              highlights.summary.push(...fields.summary.position);
            }
          }

          return { doc, highlights };
        }).filter(Boolean) as SearchResult[];

      } catch (error) {
        console.error('Search failed:', error);
        return [];
      }
    };
  }, [searchIndex, docs]);

  // Fallback simple search
  const simpleSearch = useMemo(() => {
    return (query: string): SearchResult[] => {
      if (!query.trim()) return [];
      
      const q = query.toLowerCase();
      return docs
        .filter(doc => 
          doc.title.toLowerCase().includes(q) ||
          doc.summary.toLowerCase().includes(q) ||
          doc.type.toLowerCase().includes(q)
        )
        .map(doc => ({ doc, highlights: { title: [], summary: [] } }));
    };
  }, [docs]);

  return {
    search: searchIndex ? search : simpleSearch,
    isIndexing,
    indexingProgress,
    hasIndex: !!searchIndex,
    buildIndex: buildSearchIndex
  };
}