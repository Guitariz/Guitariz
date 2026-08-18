/**
 * src/hooks/useBackendHealth.ts
 *
 * Backend health check with cold-start awareness.
 * Shows "waking up" UI if the HuggingFace Space is sleeping.
 */

import { useState, useEffect, useRef } from "react";

type HealthStatus = "unknown" | "checking" | "healthy" | "sleeping" | "error";

export function useBackendHealth(pollIntervalMs: number = 30000) {
  const [status, setStatus] = useState<HealthStatus>("unknown");
  const [fastEngine, setFastEngine] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const check = async () => {
    setStatus("checking");
    try {
      const apiUrl = (
        import.meta.env.VITE_CHORD_AI_API
          ? new URL(import.meta.env.VITE_CHORD_AI_API).origin
          : import.meta.env.VITE_API_URL || ""
      ).replace(/\/+$/, "");

      if (!apiUrl) {
        setStatus("unknown");
        return;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${apiUrl}/api/health`, { signal: controller.signal });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        setStatus("healthy");
        setFastEngine(!!data.fast_engine);
      } else {
        setStatus("sleeping");
      }
    } catch {
      setStatus("sleeping");
    }
  };

  useEffect(() => {
    check();
    intervalRef.current = setInterval(check, pollIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pollIntervalMs]);

  return { status, fastEngine, recheck: check };
}
