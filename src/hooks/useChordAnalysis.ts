import { useEffect, useState, useRef } from "react";
import { analyzeTrack } from "@/lib/analyzeAudio";
import { analyzeRemote } from "@/lib/api/analyzeClient";
import { getCachedAnalysis, setCachedAnalysis, isExpired } from "@/lib/analysisCache";
import { computeAudioCacheKey, getCachedAudio, setCachedAudio, cacheUrlResponse } from "@/lib/audioCache";
import { AnalysisResult } from "@/types/chordAI";

export type UseChordAnalysisState = {
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  instrumentalUrl?: string; // URL to instrumental track when vocal separation was used
  uploadProgress?: number; // Upload progress percentage (0-100)
};

export const useChordAnalysis = (
  audioBuffer: AudioBuffer | null,
  file?: File | null,
  useRemote: boolean = true,
  separateVocals: boolean = false,
  cacheKey?: string, // File identifier for cache checking
  cachedResult?: { result: AnalysisResult | null; instrumentalUrl?: string }, // Cached result if available
  useMadmom: boolean = true // Use fast madmom engine by default
) => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [instrumentalUrl, setInstrumentalUrl] = useState<string | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(undefined);
  const currentXhrRef = useRef<XMLHttpRequest | null>(null);
  const requestIdRef = useRef<number>(0);

  useEffect(() => {
    // compute a fallback cache key if not provided
    const computeKey = () => {
      if (cacheKey) return cacheKey;
      if (!file) return undefined;
      try {
        // Use stable file metadata as cache key: name|size|lastModified plus settings
        const parts = [file.name, String(file.size), String(file.lastModified), String(separateVocals), String(useMadmom)];
        return parts.join("::");
      } catch (err) {
        return undefined;
      }
    };

    const resolvedKey = computeKey();

    let fileToUpload: File | undefined = file ?? undefined;

    // If we have a cached result passed in props or in IndexedDB, use it
    (async () => {
      if (cachedResult && cacheKey) {
        setResult(cachedResult.result);
        setInstrumentalUrl(cachedResult.instrumentalUrl);
        setLoading(false);
        setError(null);
        return;
      }

      if (resolvedKey && typeof indexedDB !== "undefined") {
        try {
          const cached = await getCachedAnalysis(resolvedKey);
          if (cached && !isExpired(cached)) {
            setResult(cached.result as AnalysisResult);
            setInstrumentalUrl(cached.instrumentalUrl);
            setLoading(false);
            setError(null);
            return;
          }
        } catch (err) {
          console.warn("useChordAnalysis: cache read error", err);
        }
      }

      // If audio Cache Storage has the original file, we can reuse it to avoid re-upload
      if (resolvedKey && 'caches' in window && file) {
        try {
          const audioKey = await computeAudioCacheKey(file);
          const cachedBlob = await getCachedAudio(audioKey);
          if (cachedBlob) {
            // Construct a File so analyzeRemote receives same API
            const cachedFile = new File([cachedBlob], file.name, { type: cachedBlob.type });
            fileToUpload = cachedFile as File;
          }
        } catch (err) {
          console.warn('useChordAnalysis: audio cache read error', err);
        }
      }
    })();

    // Only run analysis when file changes
    if (!file) return;

    // Cancel previous request
    if (currentXhrRef.current) {
      currentXhrRef.current.abort();
      currentXhrRef.current = null;
    }

    // Generate unique ID for this request
    const thisRequestId = ++requestIdRef.current;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        setInstrumentalUrl(undefined);
        setUploadProgress(0);

        // Prefer remote analysis when a file is available
        if (useRemote && fileToUpload) {
          try {
            const apiUrl = (import.meta.env.VITE_API_URL || "http://localhost:7860").replace(/\/+$/, "");
            const remote = await analyzeRemote(
              fileToUpload!,
              undefined,
              separateVocals,
              useMadmom,
              (percent) => {
                setUploadProgress(Math.round(percent));
              },
              (xhr) => {
                // Store XHR so we can cancel it if needed
                currentXhrRef.current = xhr;
              }
            );

            // Only update if this is still the latest request
            if (thisRequestId === requestIdRef.current) {
              setResult(remote);
              setUploadProgress(undefined); // Clear progress when complete
              currentXhrRef.current = null; // Clear XHR reference
              // If vocal separation was used, construct the full URL for the instrumental
              if (remote.instrumentalUrl) {
                const fullUrl = apiUrl + remote.instrumentalUrl;
                setInstrumentalUrl(fullUrl);
              }

              // persist to cache if key resolved
              if (resolvedKey) {
                try {
                  await setCachedAnalysis(resolvedKey, { result: remote, instrumentalUrl: remote.instrumentalUrl });
                } catch (e) {
                  console.warn("useChordAnalysis: cache write error", e);
                }
              }

              // cache audio blobs: original file + instrumental (if available)
              if (resolvedKey && file) {
                try {
                  const audioKey = await computeAudioCacheKey(file);
                  // set original file into Cache Storage
                  await setCachedAudio(audioKey, file);
                } catch (err) {
                  console.warn('useChordAnalysis: set audio cache error', err);
                }
              }

              if (remote.instrumentalUrl && resolvedKey) {
                try {
                  const instrumentalKey = `${resolvedKey}::instrumental`;
                  await cacheUrlResponse(instrumentalKey, apiUrl + remote.instrumentalUrl);
                } catch (err) {
                  console.warn('useChordAnalysis: cache instrumental error', err);
                }
              }

              return;
            }
          } catch (remoteErr) {
            setUploadProgress(undefined); // Clear progress on error
            currentXhrRef.current = null; // Clear XHR reference
            // Fall back to local if remote fails
            if (audioBuffer && thisRequestId === requestIdRef.current) {
              const local = await analyzeTrack(audioBuffer);
              if (thisRequestId === requestIdRef.current) setResult(local);
              if (resolvedKey) {
                try {
                  await setCachedAnalysis(resolvedKey, { result: local });
                } catch (e) { console.warn("useChordAnalysis: cache write error", e); }
              }
            }
          }
        } else if (audioBuffer) {
          // Only use local analysis as fallback or if useRemote is false
          const local = await analyzeTrack(audioBuffer);
          if (thisRequestId === requestIdRef.current) setResult(local);
          if (resolvedKey) {
            try { await setCachedAnalysis(resolvedKey, { result: local }); } catch (e) { console.warn("useChordAnalysis: cache write error", e); }
          }
        } else if (thisRequestId === requestIdRef.current) {
          setError("No audio available for analysis.");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Analysis failed. Try another file.";
        if (thisRequestId === requestIdRef.current) {
          setError(message);
          setUploadProgress(undefined); // Clear progress on error
          currentXhrRef.current = null; // Clear XHR reference
        }
      } finally {
        if (thisRequestId === requestIdRef.current) {
          setLoading(false);
          setUploadProgress(undefined); // Clear progress when done
          currentXhrRef.current = null; // Clear XHR reference
        }
      }
    };

    run();

    // No cleanup needed - requestId comparison handles stale results
    return () => {};
  }, [file, useRemote, separateVocals, cacheKey, cachedResult, useMadmom, audioBuffer]);

  return { result, loading, error, instrumentalUrl, uploadProgress };
};

export default useChordAnalysis;
