/**
 * Share Chord Charts Utility
 * Encodes/decodes analysis results to URL-safe strings for sharing
 */

import { AnalysisResult, ChordSegment } from "@/types/chordAI";

// Compact format for sharing - reduces URL size significantly
interface ShareableData {
    v: 1; // Version for future compatibility
    f: string; // fileName
    k: string; // key
    s: string; // scale
    t: number; // tempo
    m: number; // meter
    c: [number, number, string][]; // chords as [start, end, name] tuples
}

/**
 * Compress and encode analysis result to URL-safe base64 string
 */
export function encodeShareableState(
    fileName: string,
    result: AnalysisResult
): string {
    const data: ShareableData = {
        v: 1,
        f: fileName,
        k: result.key,
        s: result.scale,
        t: Math.round(result.tempo),
        m: result.meter,
        // Use simplified chords and reduce precision for smaller URLs
        c: (result.simpleChords || result.chords).slice(0, 100).map((chord) => [
            Math.round(chord.start * 10) / 10,
            Math.round(chord.end * 10) / 10,
            chord.chord,
        ]),
    };

    // Encode to JSON, then base64
    const jsonString = JSON.stringify(data);
    const base64 = btoa(encodeURIComponent(jsonString));
    return base64;
}

/**
 * Decode URL-safe base64 string back to analysis result
 */
export function decodeShareableState(encoded: string): {
    fileName: string;
    result: AnalysisResult;
} | null {
    try {
        const jsonString = decodeURIComponent(atob(encoded));
        const data: ShareableData = JSON.parse(jsonString);

        // Version check for future compatibility
        if (data.v !== 1) {
            console.warn("Unknown share format version:", data.v);
            return null;
        }

        // Reconstruct chord segments
        const chords: ChordSegment[] = data.c.map(([start, end, chord]) => ({
            start,
            end,
            chord,
            confidence: 0.8, // Default confidence for shared chords
        }));

        const result: AnalysisResult = {
            key: data.k,
            scale: data.s,
            tempo: data.t,
            meter: data.m,
            chords,
            simpleChords: chords,
            duration: chords.length > 0 ? chords[chords.length - 1].end : 0,
        };

        return { fileName: data.f, result };
    } catch (error) {
        console.error("Failed to decode shared state:", error);
        return null;
    }
}

/**
 * Generate a shareable URL for the current analysis
 */
export function generateShareUrl(
    fileName: string,
    result: AnalysisResult
): string {
    const encoded = encodeShareableState(fileName, result);
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?share=${encoded}`;
}

/**
 * Copy text to clipboard with fallback for older browsers
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        return true;
    } catch (error) {
        console.error("Failed to copy to clipboard:", error);
        return false;
    }
}

/**
 * Extract share parameter from current URL
 */
export function getShareParamFromUrl(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get("share");
}

/**
 * Clear share parameter from URL without page reload
 */
export function clearShareParamFromUrl(): void {
    const url = new URL(window.location.href);
    url.searchParams.delete("share");
    window.history.replaceState({}, "", url.pathname);
}
