import { useEffect, useState, useRef } from "react";
import { analyzeTrack, refineKeyFromChords } from "@/lib/analyzeAudio";
import { analyzeRemote } from "@/lib/api/analyzeClient";
import { getCachedAnalysis, setCachedAnalysis, isExpired } from "@/lib/analysisCache";
import { computeAudioCacheKey, getCachedAudio, setCachedAudio, cacheUrlResponse } from "@/lib/audioCache";
import { AnalysisResult } from "@/types/chordAI";
import { getChunkRanges, filterAndAdjustChords, parseNdjsonLines } from "@/lib/chunkUtils";

function float32ArrayToWav(samples: Float32Array, sampleRate: number): Blob {
  const numOfChan = 1;
  const format = 1; // 16-bit PCM
  const bitDepth = 16;
  
  const bufferArr = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(bufferArr);
  
  const writeString = (v: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      v.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, numOfChan * 2, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, samples.length * 2, true);
  
  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  
  return new Blob([view], { type: "audio/wav" });
}


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
  const abortControllerRef = useRef<AbortController | null>(null);
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

        let fileToUpload: File | undefined = file;

        // If audio Cache Storage has the original file, we can reuse it to avoid re-upload
        if (resolvedKey && 'caches' in window) {
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
        
        if (thisRequestId !== requestIdRef.current) return;

        // Real-Time JSON Streaming Analysis:
        // We do streaming analysis only if we are using the remote fast model (useMadmom=true) and vocal filter is OFF (separateVocals=false)
        if (useRemote && useMadmom && !separateVocals && audioBuffer) {
          let hasStartedRendering = false;
          let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
          
          try {
            const chordsEndpoint = import.meta.env.VITE_CHORD_AI_API || "";
            const apiUrl = chordsEndpoint
              ? new URL(chordsEndpoint).origin
              : (import.meta.env.VITE_API_URL || "http://localhost:7860").replace(/\/+$/, "");
            
            // Adjust the endpoint to be /api/analyze-stream
            const targetEndpoint = chordsEndpoint 
              ? chordsEndpoint.replace("/api/analyze", "/api/analyze-stream")
              : `${apiUrl}/api/analyze-stream`;

            // Step A: Decouple key and tempo estimation - run local DSP once on the full AudioBuffer at start
            const localResult = await analyzeTrack(audioBuffer);
            if (thisRequestId !== requestIdRef.current) return;
            
            // Set initial state with key, scale, and tempo, but keep chords empty initially to avoid fumbling
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
            formData.append("use_madmom", useMadmom ? "true" : "false");

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
                // Request superseded, abort download
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

                if (item.type === "metadata") {
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
                  setResult(prev => {
                    const base = prev || {
                      tempo: localResult.tempo,
                      key: localResult.key,
                      scale: localResult.scale,
                      meter: 4,
                      chords: [],
                      simpleChords: []
                    };
                    
                    // Filter out existing chords in this chunk's time range
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

                    // Update IndexedDB cache incrementally
                    if (resolvedKey) {
                      setCachedAnalysis(resolvedKey, { result: mergedResult }).catch(e => {
                        console.warn("[useChordAnalysis] Incremental cache write error:", e);
                      });
                    }

                    return mergedResult;
                  });

                  // Turn off loading once the first chords chunk is successfully parsed
                  if (!hasStartedRendering) {
                    hasStartedRendering = true;
                    setLoading(false);
                  }

                  // Update progress based on duration completed
                  if (audioBuffer) {
                    percentage = Math.min(100, Math.round((item.end / audioBuffer.duration) * 100));
                    setUploadProgress(percentage);
                  }
                } else if (item.type === "error") {
                  throw new Error(item.detail || "Server analysis error");
                }
              }
            }

            // Parse final trailing chunk (if any) that has no trailing newline
            if (thisRequestId === requestIdRef.current && streamBuffer.trim()) {
              try {
                const finalItem = JSON.parse(streamBuffer);
                if (finalItem.type === "chords") {
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
                      c => c.end <= finalItem.start || c.start >= finalItem.end
                    );
                    const filteredSimpleChords = base.simpleChords.filter(
                      c => c.end <= finalItem.start || c.start >= finalItem.end
                    );

                    const newChords = [...filteredChords, ...finalItem.chords].sort((a, b) => a.start - b.start);
                    const newSimpleChords = [...filteredSimpleChords, ...finalItem.simpleChords].sort((a, b) => a.start - b.start);

                    const mergedResult = {
                      ...base,
                      chords: newChords,
                      simpleChords: newSimpleChords
                    };

                    if (resolvedKey) {
                      setCachedAnalysis(resolvedKey, { result: mergedResult }).catch(e => {
                        console.warn("[useChordAnalysis] Final cache write error:", e);
                      });
                    }

                    return mergedResult;
                  });

                  if (!hasStartedRendering) {
                    hasStartedRendering = true;
                    setLoading(false);
                  }
                }
              } catch (parseErr) {
                console.warn("[useChordAnalysis] Final NDJSON block parse failed:", parseErr);
              }
            }

            // Cache original audio in Cache Storage when completed
            if (resolvedKey && file) {
              try {
                const audioKey = await computeAudioCacheKey(file);
                await setCachedAudio(audioKey, file);
              } catch (err) {
                console.warn('[useChordAnalysis] set audio cache error:', err);
              }
            }

            return; // Done streaming analysis!
          } catch (streamErr) {
            // Check if this was a voluntary AbortController signal
            if (streamErr instanceof Error && streamErr.name === "AbortError") {
              console.log("[useChordAnalysis] Streaming request voluntarily aborted.");
              return;
            }

            console.error("[useChordAnalysis] Streaming pipeline failed, falling back to local DSP:", streamErr);
            
            // Clean up reader
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

        // Fallback or Standard Full File Analysis path (if chunked fails, useMadmom=false, or separateVocals=true)
        if (thisRequestId !== requestIdRef.current) return;

        // Prefer remote analysis when a file is available
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
              if (remote && remote.key && remote.chords) {
                const refined = refineKeyFromChords(remote.key, remote.scale || "major", remote.chords);
                remote.key = refined.key;
                remote.scale = refined.scale;
              }
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

    // Abort any ongoing request if dependencies change or component unmounts
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
  }, [file, useRemote, separateVocals, cacheKey, cachedResult, useMadmom, audioBuffer]);

  return { result, loading, error, instrumentalUrl, uploadProgress };
};

export default useChordAnalysis;
