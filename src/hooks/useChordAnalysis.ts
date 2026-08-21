/**
 * src/hooks/useChordAnalysis.ts
 *
 * Central analysis orchestration hook.
 *
 * Flow:
 *   1. Check IndexedDB cache → return immediately if hit
 *   2. If mode is fast/precise → use NDJSON streaming (/api/analyze-stream)
 *      - Run local DSP for key/tempo immediately (instant feedback)
 *      - Stream chord chunks from backend progressively
 *   3. If mode is balanced → use standard POST (/api/analyze)
 *   4. If backend fails → fall back to local analyzeTrack() (browser-only)
 *   5. Cache results in IndexedDB + audio in Cache Storage
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { analyzeTrack, refineKeyFromChords } from "@/lib/analyzeAudio";
import { analyzeRemote } from "@/lib/api/analyzeClient";
import { getCachedAnalysis, setCachedAnalysis, isExpired, removeCachedAnalysis } from "@/lib/analysisCache";
import { computeAudioCacheKey, getCachedAudio, setCachedAudio, cacheUrlResponse, removeCachedAudio } from "@/lib/audioCache";
import { AnalysisResult, ChordSegment } from "@/types/chordAI";
import { parseNdjsonLines } from "@/lib/chunkUtils";
import { AnalysisMode } from "@/stores/chordAIStore";

export type UseChordAnalysisState = {
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  instrumentalUrl?: string;
  uploadProgress?: number;
  progressMessage?: string | null;
  isFromCache?: boolean;
  isFallback?: boolean;
  reanalyze: () => Promise<void>;
};

export const useChordAnalysis = (
  audioBuffer: AudioBuffer | null,
  file?: File | null,
  useRemote: boolean = true,
  separateVocals: boolean = false,
  cacheKey?: string,
  cachedResult?: { result: AnalysisResult | null; instrumentalUrl?: string },
  analysisMode: AnalysisMode = "balanced"
) => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [instrumentalUrl, setInstrumentalUrl] = useState<string | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(undefined);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [reanalyzeCount, setReanalyzeCount] = useState<number>(0);
  const currentXhrRef = useRef<XMLHttpRequest | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);

  const computeKey = useCallback(() => {
    if (cacheKey) return cacheKey;
    if (!file) return undefined;
    try {
      const parts = [file.name, String(file.size), String(file.lastModified), String(separateVocals), String(analysisMode)];
      return parts.join("::");
    } catch {
      return undefined;
    }
  }, [cacheKey, file, separateVocals, analysisMode]);

  const reanalyze = useCallback(async () => {
    const key = computeKey();
    if (key) {
      await removeCachedAnalysis(key);
    }
    if (file) {
      try {
        const audioKey = await computeAudioCacheKey(file);
        await removeCachedAudio(audioKey);
      } catch {
        // ignore
      }
    }
    setResult(null);
    setIsFromCache(false);
    setReanalyzeCount(prev => prev + 1);
  }, [computeKey, file]);

  useEffect(() => {
    const resolvedKey = computeKey();
    const thisRequestId = ++requestIdRef.current;
    const isForcedReanalyze = reanalyzeCount > 0;

    const run = async () => {
      // 1. Use cached result from props (only if not forced)
      if (!isForcedReanalyze && cachedResult && cacheKey) {
        if (thisRequestId !== requestIdRef.current) return;
        setResult(cachedResult.result);
        setInstrumentalUrl(cachedResult.instrumentalUrl);
        setIsFromCache(true);
        setLoading(false);
        setError(null);
        setProgressMessage(null);
        return;
      }

      // 2. Check IndexedDB cache (only if not forced)
      if (!isForcedReanalyze && resolvedKey && typeof indexedDB !== "undefined") {
        try {
          const cached = await getCachedAnalysis(resolvedKey);
          if (cached && !isExpired(cached)) {
            if (thisRequestId !== requestIdRef.current) return;
            setResult(cached.result as AnalysisResult);
            setInstrumentalUrl(cached.instrumentalUrl);
            setIsFromCache(true);
            setLoading(false);
            setError(null);
            setProgressMessage(null);
            return;
          }
        } catch (err) {
          console.warn("useChordAnalysis: cache read error", err);
        }
      }

      if (!file) {
        // Local buffer fallback if no file provided
        if (audioBuffer && !result) {
          try {
            setLoading(true);
            const localResult = await analyzeTrack(audioBuffer);
            if (thisRequestId === requestIdRef.current) {
              setResult(localResult);
              setLoading(false);
            }
          } catch (e) {
            if (thisRequestId === requestIdRef.current) {
              setError(e instanceof Error ? e.message : "Analysis failed");
              setLoading(false);
            }
          }
        }
        return;
      }
      if (thisRequestId !== requestIdRef.current) return;

      try {
        setIsFromCache(false);
        setLoading(true);
        setError(null);
        setInstrumentalUrl(undefined);
        setUploadProgress(0);
        setProgressMessage(null);

        let fileToUpload: File | undefined = file;

        // Try to reuse cached audio file
        if (resolvedKey && 'caches' in window) {
          try {
            const audioKey = await computeAudioCacheKey(file);
            const cachedBlob = await getCachedAudio(audioKey);
            if (cachedBlob) {
              fileToUpload = new File([cachedBlob], file.name, { type: cachedBlob.type });
            }
          } catch (err) {
            console.warn('useChordAnalysis: audio cache read error', err);
          }
        }

        if (thisRequestId !== requestIdRef.current) return;

        // ── STREAMING PATH (fast/precise modes) ────────────────────────────
        const isStreamingMode = analysisMode === "fast" || analysisMode === "precise";
        if (useRemote && isStreamingMode && audioBuffer) {
          let hasStartedRendering = false;
          let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

          try {
            const chordsEndpoint = import.meta.env.VITE_CHORD_AI_API || "";
            const apiUrl = chordsEndpoint
              ? new URL(chordsEndpoint).origin
              : (import.meta.env.VITE_API_URL || "http://localhost:7860").replace(/\/+$/, "");

            const targetEndpoint = chordsEndpoint
              ? chordsEndpoint.replace("/api/analyze", "/api/analyze-stream")
              : `${apiUrl}/api/analyze-stream`;

            // Run local DSP first for instant key/tempo feedback
            const localResult = await analyzeTrack(audioBuffer);
            if (thisRequestId !== requestIdRef.current) return;

            setResult({
              tempo: localResult.tempo,
              key: localResult.key,
              scale: localResult.scale,
              meter: 4,
              chords: [],
              simpleChords: [],
            });

            // Start streaming fetch
            const controller = new AbortController();
            abortControllerRef.current = controller;

            const formData = new FormData();
            formData.append("file", fileToUpload);
            formData.append("separate_vocals", separateVocals ? "true" : "false");
            formData.append("use_madmom", (analysisMode === "fast") ? "true" : "false");
            formData.append("mode", analysisMode);

            const response = await fetch(targetEndpoint, {
              method: "POST",
              body: formData,
              signal: controller.signal,
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            if (!response.body) throw new Error("No response body available for streaming");

            reader = response.body.getReader();
            const decoder = new TextDecoder();
            let streamBuffer = "";
            let percentage = 0;

            while (true) {
              if (thisRequestId !== requestIdRef.current) {
                await reader.cancel();
                controller.abort();
                return;
              }

              const { value, done } = await reader.read();
              if (done) break;

              streamBuffer += decoder.decode(value, { stream: true });
              const parseResult = parseNdjsonLines(streamBuffer);
              streamBuffer = parseResult.remaining;

              for (const item of parseResult.items) {
                if (thisRequestId !== requestIdRef.current) return;

                if (item.type === "progress") {
                  setProgressMessage(item.message);
                  setUploadProgress(item.percent);
                } else if (item.type === "metadata") {
                  setResult((prev): AnalysisResult => {
                    const base: AnalysisResult = prev || {
                      tempo: item.tempo ?? localResult.tempo,
                      key: item.key ?? localResult.key,
                      scale: item.scale ?? localResult.scale,
                      meter: item.meter ?? 4,
                      chords: [],
                      simpleChords: [],
                    };
                    return {
                      ...base,
                      tempo: typeof item.tempo === "number" ? item.tempo : base.tempo,
                      key: typeof item.key === "string" ? item.key : base.key,
                      scale: typeof item.scale === "string" ? item.scale : base.scale,
                      meter: typeof item.meter === "number" ? item.meter : base.meter,
                      instrumentalUrl: item.instrumentalUrl ?? base.instrumentalUrl,
                    };
                  });
                  if (item.instrumentalUrl) {
                    setInstrumentalUrl(apiUrl + item.instrumentalUrl);
                  }
                } else if (item.type === "chords") {
                  setProgressMessage(null);
                  setResult((prev): AnalysisResult => {
                    const base: AnalysisResult = prev || {
                      tempo: localResult.tempo,
                      key: localResult.key,
                      scale: localResult.scale,
                      meter: 4,
                      chords: [],
                      simpleChords: [],
                    };

                    const filteredChords = base.chords.filter(
                      c => c.end <= item.start || c.start >= item.end
                    );
                    const filteredSimpleChords = base.simpleChords.filter(
                      c => c.end <= item.start || c.start >= item.end
                    );

                    const newChords: ChordSegment[] = [...filteredChords, ...item.chords].sort((a, b) => a.start - b.start);
                    const newSimpleChords: ChordSegment[] = [...filteredSimpleChords, ...item.simpleChords].sort((a, b) => a.start - b.start);

                    const mergedResult: AnalysisResult = { ...base, chords: newChords, simpleChords: newSimpleChords };

                    if (resolvedKey) {
                      setCachedAnalysis(resolvedKey, { result: mergedResult }).catch(e => {
                        console.warn("[useChordAnalysis] Incremental cache write error:", e);
                      });
                    }

                    return mergedResult;
                  });

                  if (!hasStartedRendering) {
                    hasStartedRendering = true;
                    setLoading(false);
                  }

                  if (audioBuffer) {
                    percentage = Math.min(100, Math.round((item.end / audioBuffer.duration) * 100));
                    setUploadProgress(percentage);
                  }
                } else if (item.type === "error") {
                  throw new Error(item.detail || "Server analysis error");
                }
              }
            }

            if (thisRequestId !== requestIdRef.current) return;

            // Cache audio on success
            if (resolvedKey && file) {
              try {
                const audioKey = await computeAudioCacheKey(file);
                await setCachedAudio(audioKey, file);
              } catch (err) {
                console.warn('[useChordAnalysis] set audio cache error:', err);
              }
            }

            setUploadProgress(undefined);
            setProgressMessage(null);
            setLoading(false);
            return;
          } catch (streamErr) {
            if (streamErr instanceof Error && streamErr.name === "AbortError") {
              console.log("[useChordAnalysis] Streaming request voluntarily aborted.");
              return;
            }

            console.error("[useChordAnalysis] Streaming pipeline failed, falling back to local DSP:", streamErr);

            if (reader) {
              try { await reader.cancel(); } catch { /* ignore */ }
            }

            // Fallback to local DSP
            if (audioBuffer && thisRequestId === requestIdRef.current) {
              const local = await analyzeTrack(audioBuffer);
              if (thisRequestId === requestIdRef.current) {
                setResult(local);
                setIsFallback(true);
                setLoading(false);
                setUploadProgress(undefined);
                setProgressMessage(null);
              }
              if (resolvedKey) {
                try { await setCachedAnalysis(resolvedKey, { result: local }); } catch { /* ignore */ }
              }
            }
            return;
          } finally {
            if (thisRequestId === requestIdRef.current) {
              abortControllerRef.current = null;
            }
          }
        }

        // ── STANDARD PATH (balanced mode or non-streaming) ─────────────────
        if (thisRequestId !== requestIdRef.current) return;

        if (useRemote && fileToUpload) {
          try {
            const chordsEndpoint = import.meta.env.VITE_CHORD_AI_API || "";
            const apiUrl = chordsEndpoint
              ? new URL(chordsEndpoint).origin
              : (import.meta.env.VITE_API_URL || "http://localhost:7860").replace(/\/+$/, "");

            const remote = await analyzeRemote(
              fileToUpload,
              undefined,
              separateVocals,
              analysisMode,
              (percent) => { setUploadProgress(Math.round(percent)); },
              (xhr) => { currentXhrRef.current = xhr; }
            );

            if (thisRequestId === requestIdRef.current) {
              if (remote && remote.key && remote.chords) {
                const refined = refineKeyFromChords(remote.key, remote.scale || "major", remote.chords);
                remote.key = refined.key;
                remote.scale = refined.scale;
              }
              setResult(remote);
              setIsFallback(false);
              setUploadProgress(undefined);
              setProgressMessage(null);
              currentXhrRef.current = null;
              if (remote.instrumentalUrl) {
                const fullUrl = apiUrl + remote.instrumentalUrl;
                setInstrumentalUrl(fullUrl);
              }

              if (resolvedKey) {
                try {
                  await setCachedAnalysis(resolvedKey, { result: remote, instrumentalUrl: remote.instrumentalUrl });
                } catch { /* ignore */ }
              }

              if (resolvedKey && file) {
                try {
                  const audioKey = await computeAudioCacheKey(file);
                  await setCachedAudio(audioKey, file);
                } catch { /* ignore */ }
              }

              if (remote.instrumentalUrl && resolvedKey) {
                try {
                  const instrumentalKey = `${resolvedKey}::instrumental`;
                  await cacheUrlResponse(instrumentalKey, apiUrl + remote.instrumentalUrl);
                } catch { /* ignore */ }
              }

              return;
            }
          } catch {
            setUploadProgress(undefined);
            setProgressMessage(null);
            currentXhrRef.current = null;
            if (audioBuffer && thisRequestId === requestIdRef.current) {
              const local = await analyzeTrack(audioBuffer);
              if (thisRequestId === requestIdRef.current) {
                setResult(local);
                setIsFallback(true);
              }
              if (resolvedKey) {
                try { await setCachedAnalysis(resolvedKey, { result: local }); } catch { /* ignore */ }
              }
            }
          }
        } else if (audioBuffer) {
          const local = await analyzeTrack(audioBuffer);
          if (thisRequestId === requestIdRef.current) {
            setResult(local);
            setIsFallback(true);
          }
          if (resolvedKey) {
            try { await setCachedAnalysis(resolvedKey, { result: local }); } catch { /* ignore */ }
          }
        } else if (thisRequestId === requestIdRef.current) {
          setError("No audio available for analysis.");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Analysis failed. Try another file.";
        if (thisRequestId === requestIdRef.current) {
          setError(message);
          setUploadProgress(undefined);
          setProgressMessage(null);
          currentXhrRef.current = null;
        }
      } finally {
        if (thisRequestId === requestIdRef.current) {
          setLoading(false);
          setUploadProgress(undefined);
          setProgressMessage(null);
          currentXhrRef.current = null;
        }
      }
    };

    run();

    return () => {
      if (currentXhrRef.current) {
        currentXhrRef.current.abort();
        currentXhrRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [file, useRemote, separateVocals, cacheKey, cachedResult, analysisMode, audioBuffer, reanalyzeCount, computeKey]);

  return { result, loading, error, instrumentalUrl, uploadProgress, progressMessage, isFromCache, isFallback, reanalyze };
};

export default useChordAnalysis;
