import { useState, useEffect } from "react";

export type HealthStatus = "checking" | "online" | "offline";

export const useBackendHealth = (intervalMs: number = 30000) => {
    const [status, setStatus] = useState<HealthStatus>("checking");

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const apiUrl = (import.meta.env.VITE_API_URL || "http://localhost:7860").replace(/\/+$/, "");
                const response = await fetch(`${apiUrl}/health`, {
                    method: "GET",
                    headers: {
                        "Accept": "application/json",
                    },
                    // Short timeout for health checks
                    signal: AbortSignal.timeout(5000)
                });

                if (response.ok) {
                    setStatus("online");
                } else {
                    setStatus("offline");
                }
            } catch (error) {
                setStatus("offline");
            }
        };

        checkHealth();
        const id = setInterval(checkHealth, intervalMs);

        return () => clearInterval(id);
    }, [intervalMs]);

    return status;
};

export default useBackendHealth;
