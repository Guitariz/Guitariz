import { useEffect, useState, useRef } from "react";
import { analyzeTrack, refineKeyFromChords } from "@/lib/analyzeAudio";
import { analyzeRemote } from "@/lib/api/analyzeClient";
import { getCachedAnalysis, setCachedAnalysis, isExpired } from "@/lib/analysisCache";
import { computeAudioCacheKey, getCachedAudio, setCachedAudio, cacheUrlResponse } from "@/lib/audioCache";
import { AnalysisResult } from "@/types/chordAI";
import { parseNdjsonLines } from "@/lib/chunkUtils";
import { AnalysisMode } from "@/stores/chordAIStore";

export type UseChordAnalysisState = {
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  instrumentalUrl?: string;
  uploadProgress?: number;
  progressMessage?: string | null;
};

export const useChordAnalysis = (
  audioBuffer: AudioBuffer | null,
  file?: File | null,
  useRemote: boolean = true,
  separateVocals: boolean = false,
  cacheKey?: string, // File identifier for cache checking
  cachedResult?: { result: AnalysisResult | null; instrumentalUrl?: string }, // Cached result if available
  analysisMode: AnalysisMode = "balanced"
) => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [instrumentalUrl, setInstrumentalUrl] = useState<string | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(undefined);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const currentXhrRef = useRef<XMLHttpRequest | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef<number>(0);

  useEffect(() => {
    // compute a fallback cache key if not provided
    const computeKey = () => {
      if (cacheKey) return cacheKey;
      if (!file) return undefined;
      try {
        const parts = [file.name, String(file.size), String(file.lastModified), String(separateVocals), String(analysisMode)];
        return parts.join("::");
      } catch (err) {
        return undefined;
      }
    };

    const resolvedKey = computeKey();
    
    // Generate unique ID for this request
    const thisRequestId = ++requestIdRef.current;

    const run = async () => {
      // 1. If we have a cached result passed in props, use it immediately and skip fetching
      if (cachedResult && cacheKey) {
        if (thisRequestId !== requestIdRef.current) return;
        setResult(cachedResult.result);
        setInstrumentalUrl(cachedResult.instrumentalUrl);
        setLoading(false);
        setError(null);
        setProgressMessage(null);
        return;
      }

      // 2. If we have a cached result in IndexedDB, use it and skip fetching
      if (resolvedKey && typeof indexedDB !== "undefined") {
        try {
          const cached = await getCachedAnalysis(resolvedKey);
          if (cached && !isExpired(cached)) {
            if (thisRequestId !== requestIdRef.current) return;
            setResult(cached.result as AnalysisResult);
            setInstrumentalUrl(cached.instrumentalUrl);
            setLoading(false);
            setError(null);
            setProgressMessage(null);
            return;
          }
        } catch (err) {
          console.warn("useChordAnalysis: cache read error", err);
        }
      }

      // Only run analysis when file changes
      if (!file) return;

      if (thisRequestId !== requestIdRef.current) return;

      try {
        setLoading(true);
        setError(null);
        setInstrumentalUrl(undefined);
        setUploadProgress(0);
        setProgressMessage(null);

        let fileToUpload: File | undefined = file;

        // If audio Cache Storage has the original file, we can reuse it to avoid re-upload
        if (resolvedKey && 'caches' in window) {
          try {
            const audioKey = await computeAudioCacheKey(file);
            const cachedBlob = await getCachedAudio(audioKey);
            if (cachedBlob) {
              const cachedFile = new File([cachedBlob], file.name, { type: cachedBlob.type });
              fileToUpload = cachedFile as File;
            }
          } catch (err) {
            console.warn('useChordAnalysis: audio cache read error', err);
          }
        }
        
        if (thisRequestId !== requestIdRef.current) return;

        // Real-Time JSON Streaming Analysis:
        // We do streaming analysis if we are using the remote model and mode is 'fast' or 'precise'
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

            // Step A: Decouple key and tempo estimation - run local DSP once on the full AudioBuffer at start
            const localResult = await analyzeTrack(audioBuffer);
            if (thisRequestId !== requestIdRef.current) return;
            
            // Set initial state with key, scale, and tempo
            setResult({
              tempo: localResult.tempo,
              key: localResult.key,
              scale: localResult.scale,
              meter: 4,
              chords: [],
              simpleChords: []
            });

            // Initialize AbortController for streaming fetch request
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
              signal: controller.signal
            });

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            if (!response.body) {
              throw new Error("No response body available for streaming");
            }

            reader = response.body.getReader();
            const decoder = new TextDecoder();
            let streamBuffer = "";
            let percentage = 0;

            // Start reading the NDJSON stream
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
                  setResult(prev => {
                    const base = prev || {
                      tempo: item.tempo ?? localResult.tempo,
                      key: item.key ?? localResult.key,
                      scale: item.scale ?? localResult.scale,
                      meter: item.meter ?? 4,
                      chords: [],
                      simpleChords: []
                    };
                    return {
                      ...base,
                      tempo: item.tempo ?? base.tempo,
                      key: item.key ?? base.key,
                      scale: item.scale ?? base.scale,
                      meter: item.meter ?? base.meter,
                      instrumentalUrl: item.instrumentalUrl
                    };
                  });
                  
                  if (item.instrumentalUrl) {
                    setInstrumentalUrl(apiUrl + item.instrumentalUrl);
                  }
                } else if (item.type === "chords") {
                  // Clear progress message once chords start streaming
                  setProgressMessage(null);
                  setResult(prev => {
                    const base = prev || {
                      tempo: localResult.tempo,
                      key: localResult.key,
                      scale: localResult.scale,
                      meter: 4,
                      chords: [],
                      simpleChords: []
                    };
                    
                    const filteredChords = base.chords.filter(
                      c => c.end <= item.start || c.start >= item.end
                    );
                    const filteredSimpleChords = base.simpleChords.filter(
                      c => c.end <= item.start || c.start >= item.end
                    );

                    const newChords = [...filteredChords, ...item.chords].sort((a, b) => a.start - b.start);
                    const newSimpleChords = [...filteredSimpleChords, ...item.simpleChords].sort((a, b) => a.start - b.start);

                    const mergedResult = {
                      ...base,
                      chords: newChords,
                      simpleChords: newSimpleChords
                    };

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

            // Cache original audio in Cache Storage when completed
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
              try {
                await reader.cancel();
              } catch (e) {
                // ignore
              }
            }

            // Fallback: run full local DSP analysis
            if (audioBuffer && thisRequestId === requestIdRef.current) {
              const local = await analyzeTrack(audioBuffer);
              if (thisRequestId === requestIdRef.current) {
                setResult(local);
                setLoading(false);
                setUploadProgress(undefined);
                setProgressMessage(null);
              }
              if (resolvedKey) {
                try {
                  await setCachedAnalysis(resolvedKey, { result: local });
                } catch (e) {
                  console.warn("useChordAnalysis: cache write error", e);
                }
              }
            }
            return;
          } finally {
            if (thisRequestId === requestIdRef.current) {
              abortControllerRef.current = null;
            }
          }
        }

        // Fallback or Standard Full File Analysis path (if mode is balanced or streaming is disabled)
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
              (percent) => {
                setUploadProgress(Math.round(percent));
              },
              (xhr) => {
                currentXhrRef.current = xhr;
              }
            );

            if (thisRequestId === requestIdRef.current) {
              if (remote && remote.key && remote.chords) {
                const refined = refineKeyFromChords(remote.key, remote.scale || "major", remote.chords);
                remote.key = refined.key;
                remote.scale = refined.scale;
              }
              setResult(remote);
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
                } catch (e) {
                  console.warn("useChordAnalysis: cache write error", e);
                }
              }

              if (resolvedKey && file) {
                try {
                  const audioKey = await computeAudioCacheKey(file);
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
            setUploadProgress(undefined);
            setProgressMessage(null);
            currentXhrRef.current = null;
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
  }, [file, useRemote, separateVocals, cacheKey, cachedResult, analysisMode, audioBuffer]);

  return { result, loading, error, instrumentalUrl, uploadProgress, progressMessage };
};

export default useChordAnalysis;
