import { useEffect, useState } from "react";
import { analyzeTrack } from "@/lib/analyzeAudio";
import { analyzeRemote } from "@/lib/api/analyzeClient";
import { AnalysisResult } from "@/types/chordAI";

export type UseChordAnalysisState = {
  result: AnalysisResult | null;
  loading: boolean;
  error: string | null;
};

export const useChordAnalysis = (
  audioBuffer: AudioBuffer | null,
  file?: File | null,
  useRemote: boolean = true,
): UseChordAnalysisState => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!audioBuffer && !file) return;
    let isCancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        // Prefer remote analysis when a file is available
        if (useRemote && file) {
          try {
            const remote = await analyzeRemote(file);
            if (!isCancelled) {
              setResult(remote);
              return;
            }
          } catch (remoteErr) {
            console.warn("Remote analysis failed, falling back to local", remoteErr);
          }
        }

        if (audioBuffer) {
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
  }, [audioBuffer, file, useRemote]);

  return { result, loading, error };
};

export default useChordAnalysis;
