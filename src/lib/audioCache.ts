/**
 * src/lib/audioCache.ts
 *
 * Cache Storage API for caching uploaded audio files.
 * Avoids re-uploading the same file on re-analysis.
 */

const CACHE_NAME = "guitariz-audio-cache";

/**
 * Compute a cache key from a File's metadata (name + size + lastModified).
 * Uses a simple hash — no need for crypto-strength uniqueness here.
 */
export async function computeAudioCacheKey(file: File): Promise<string> {
  const raw = `${file.name}::${file.size}::${file.lastModified}`;
  // Simple FNV-1a hash for cache key
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return `audio-${hash.toString(36)}`;
}

/**
 * Retrieve a cached audio blob by key.
 */
export async function getCachedAudio(key: string): Promise<Blob | null> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(key);
    if (response) {
      return await response.blob();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Cache an audio file (File or Blob) by key.
 */
export async function setCachedAudio(key: string, data: File | Blob): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(data, {
      headers: { "Content-Type": data.type || "audio/mpeg" },
    });
    await cache.put(key, response);
  } catch {
    // Cache Storage may not be available — silently ignore
  }
}

/**
 * Cache a remote URL's response (e.g., instrumental track from backend).
 */
export async function cacheUrlResponse(key: string, url: string): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch(url);
    if (response.ok) {
      await cache.put(key, response);
    }
  } catch {
    // Silently fail
  }
}

/**
 * Remove a single audio file from cache.
 */
export async function removeCachedAudio(key: string): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(key);
  } catch {
    // Silently fail
  }
}

/**
 * Clear all cached audio files.
 */
export async function clearAllAudioCache(): Promise<void> {
  try {
    await caches.delete(CACHE_NAME);
  } catch {
    // Silently fail
  }
}
