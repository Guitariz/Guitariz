// Cache Storage helper for storing audio blobs (fallback for IndexedDB audio caching)
const CACHE_NAME = "guitariz-audio";

async function computeFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuf = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuf));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function computeAudioCacheKey(file: File): Promise<string> {
  // Use content-hash to be robust against name/mtime differences
  const h = await computeFileHash(file);
  return `audio::${h}`;
}

export async function getCachedAudio(key: string): Promise<Blob | null> {
  try {
    if (!('caches' in window)) return null;
    const cache = await caches.open(CACHE_NAME);
    const resp = await cache.match(key);
    if (!resp) return null;
    const blob = await resp.blob();
    return blob;
  } catch (err) {
    console.warn('audioCache:getCachedAudio', err);
    return null;
  }
}

export async function setCachedAudio(key: string, blob: Blob): Promise<void> {
  try {
    if (!('caches' in window)) return;
    const cache = await caches.open(CACHE_NAME);
    const resp = new Response(blob, { headers: { 'Content-Type': blob.type || 'audio/wav' } });
    await cache.put(key, resp);
  } catch (err) {
    console.warn('audioCache:setCachedAudio', err);
  }
}

export async function cacheUrlResponse(key: string, url: string): Promise<void> {
  try {
    if (!('caches' in window)) return;
    const cache = await caches.open(CACHE_NAME);
    const resp = await fetch(url);
    if (!resp.ok) return;
    await cache.put(key, resp.clone());
  } catch (err) {
    console.warn('audioCache:cacheUrlResponse', err);
  }
}

export async function deleteCachedAudio(key: string): Promise<void> {
  try {
    if (!('caches' in window)) return;
    const cache = await caches.open(CACHE_NAME);
    await cache.delete(key);
  } catch (err) {
    console.warn('audioCache:deleteCachedAudio', err);
  }
}
