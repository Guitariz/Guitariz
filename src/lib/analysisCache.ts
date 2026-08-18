/**
 * src/lib/analysisCache.ts
 *
 * IndexedDB-based analysis result caching.
 * Avoids re-analyzing the same file by caching results keyed by
 * file hash (name + size + last modified + settings).
 *
 * Cache TTL: 24 hours.
 */

import { AnalysisResult } from "@/types/chordAI";

const DB_NAME = "guitariz-analysis-cache";
const STORE_NAME = "analyses";
const DB_VERSION = 1;
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CachedEntry {
  key: string;
  result: AnalysisResult;
  instrumentalUrl?: string;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedAnalysis(key: string): Promise<CachedEntry | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function setCachedAnalysis(
  key: string,
  data: { result: AnalysisResult; instrumentalUrl?: string }
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const entry: CachedEntry = {
        key,
        result: data.result,
        instrumentalUrl: data.instrumentalUrl,
        timestamp: Date.now(),
      };
      const req = store.put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Silently fail — cache is a best-effort optimization
  }
}

export async function removeCachedAnalysis(key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Silently fail
  }
}

export async function clearAllAnalysisCache(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Silently fail
  }
}

export function isExpired(entry: CachedEntry): boolean {
  return Date.now() - entry.timestamp > TTL_MS;
}
