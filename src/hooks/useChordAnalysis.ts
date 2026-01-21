import { useEffect, useState } from "react";
import { analyzeTrack } from "@/lib/analyzeAudio";
import { analyzeRemote } from "@/lib/api/analyzeClient";
import { AnalysisResult } from "@/types/chordAI";

export type UseChordAnalysisState = {
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
  instrumentalUrl?: string; // URL to instrumental track when vocal separation was used
};

export const useChordAnalysis = (
  audioBuffer: AudioBuffer | null,
  file?: File | null,
  useRemote: boolean = true,
  separateVocals: boolean = false,
  cacheKey?: string, // File identifier for cache checking
  cachedResult?: { result: any; instrumentalUrl?: string }, // Cached result if available
  useMadmom: boolean = true // Use fast madmom engine by default
): UseChordAnalysisState => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [instrumentalUrl, setInstrumentalUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    // If we have a cached result for this file+settings combo, use it
    if (cachedResult && cacheKey) {
      console.log("Using cached analysis result for key:", cacheKey);
      setResult(cachedResult.result);
      setInstrumentalUrl(cachedResult.instrumentalUrl);
      setLoading(false);
      setError(null);
      return;
    }

    // Only run analysis when file changes
    if (!file) return;
    let isCancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        setInstrumentalUrl(undefined);
        
        // Prefer remote analysis when a file is available
        if (useRemote && file) {
          try {
            const apiUrl = (import.meta.env.VITE_API_URL || "http://localhost:7860").replace(/\/+$/, "");
            const remote = await analyzeRemote(file, undefined, separateVocals, useMadmom);
            console.log("Analysis result:", remote);
            console.log("API URL:", apiUrl);
            if (!isCancelled) {
              setResult(remote);
              // If vocal separation was used, construct the full URL for the instrumental
              if (remote.instrumentalUrl) {
                const fullUrl = apiUrl + remote.instrumentalUrl;
                console.log("Setting instrumental URL:", fullUrl);
                setInstrumentalUrl(fullUrl);
              } else {
                console.log("No instrumentalUrl in response");
              }
              return;
            }
          } catch (remoteErr) {
            console.warn("Remote analysis failed, falling back to local", remoteErr);
            // Fall back to local if remote fails
            if (audioBuffer && !isCancelled) {
              const local = await analyzeTrack(audioBuffer);
              if (!isCancelled) setResult(local);
            }
          }
        } else if (audioBuffer) {
          // Only use local analysis as fallback or if useRemote is false
          const local = await analyzeTrack(audioBuffer);
          if (!isCancelled) setResult(local);
        } else if (!isCancelled) {
          setError("No audio available for analysis.");
        }
      } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "Analysis failed. Try another file.";
        if (!isCancelled) setError(message);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    run();

    return () => {
      isCancelled = true;
    };
  }, [file, useRemote, separateVocals, cacheKey, cachedResult]);

  return { result, loading, error, instrumentalUrl };
};

export default useChordAnalysis;
