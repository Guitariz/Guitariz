import { useState, useEffect, useCallback } from "react";
import { AnalysisResult } from "@/types/chordAI";

export interface HistoryEntry {
    id: string;
    timestamp: number;
    fileName: string;
    result: AnalysisResult;
    instrumentalUrl?: string;
    useMadmom: boolean;
    separateVocals: boolean;
}

const STORAGE_KEY = "guitariz_analysis_history";
const MAX_HISTORY_ITEMS = 10;

export const useAnalysisHistory = () => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    // Load history from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse history", e);
            }
        }
    }, []);

    const saveToHistory = useCallback((entry: Omit<HistoryEntry, "id" | "timestamp">) => {
        setHistory((prev) => {
            const newEntry: HistoryEntry = {
                ...entry,
                id: crypto.randomUUID(),
                timestamp: Date.now(),
            };

            // Filter out duplicate fileName and keep max items
            const updated = [newEntry, ...prev.filter(item => item.fileName !== entry.fileName)].slice(0, MAX_HISTORY_ITEMS);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    const removeFromHistory = useCallback((id: string) => {
        setHistory((prev) => {
            const updated = prev.filter((item) => item.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return { history, saveToHistory, removeFromHistory, clearHistory };
};

export default useAnalysisHistory;
