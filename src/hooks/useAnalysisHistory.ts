/**
 * src/hooks/useAnalysisHistory.ts
 *
 * Analysis history management using IndexedDB.
 * Stores recent analysis results so users can quickly revisit past analyses.
 */

import { useState, useEffect, useCallback } from "react";
import { AnalysisResult } from "@/types/chordAI";

const DB_NAME = "guitariz-analysis-history";
const STORE_NAME = "history";
const DB_VERSION = 1;
const MAX_HISTORY = 20;

export interface HistoryEntry {
  id: string;
  fileName: string;
  result: AnalysisResult;
  timestamp: number;
  instrumentalUrl?: string;
  separateVocals?: boolean;
  analysisMode?: "fast" | "balanced" | "precise";
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function useAnalysisHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const entries = (req.result as HistoryEntry[])
          .filter(e => e && e.result && typeof e.result === "object")
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          .slice(0, MAX_HISTORY);
        setHistory(entries);
      };
    } catch {
      console.warn("[History] Failed to load history");
    }
  };

  const saveToHistory = useCallback(async (
    fileName: string,
    result: AnalysisResult,
    instrumentalUrl?: string,
    separateVocals?: boolean,
    analysisMode?: "fast" | "balanced" | "precise"
  ) => {
    if (!result) return;
    try {
      const entry: HistoryEntry = {
        id: `${fileName}::${Date.now()}`,
        fileName,
        result,
        timestamp: Date.now(),
        instrumentalUrl,
        separateVocals,
        analysisMode,
      };

      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(entry);

      // Prune old entries
      const countReq = store.count();
      countReq.onsuccess = () => {
        if (countReq.result > MAX_HISTORY) {
          const idx = store.index("timestamp");
          const cursor = idx.openCursor();
          let deleted = 0;
          const toDelete = countReq.result - MAX_HISTORY;
          cursor.onsuccess = () => {
            const result = cursor.result;
            if (result && deleted < toDelete) {
              result.delete();
              deleted++;
              result.continue();
            }
          };
        }
      };

      await loadHistory();
    } catch {
      console.warn("[History] Failed to save to history");
    }
  }, []);

  const removeFromHistory = useCallback(async (id: string) => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(id);
      await loadHistory();
    } catch {
      console.warn("[History] Failed to remove from history");
    }
  }, []);

  const clearHistory = useCallback(async () => {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).clear();
      setHistory([]);
    } catch {
      console.warn("[History] Failed to clear history");
    }
  }, []);

  return { history, saveToHistory, removeFromHistory, clearHistory };
}
