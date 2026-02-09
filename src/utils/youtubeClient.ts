// List of available Cobalt/Piped instances (Client-Side)
// Sourced from cobalt.directory and piped.video - Checked Feb 2025
const COBALT_INSTANCES = [
    "https://cobalt.154.53.56.152.sslip.io", // Often reliable
    "https://cobalt.kwiatekmiki.pl",
    "https://cobalt.zuo.bz",
    "https://co.wuk.sh",
    "https://api.cobalt.tools", // Official, often rate limited but worth a try
    "https://cobalt.ducks.party",
];

const PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://api.piped.privacy.com.de",
    "https://pipedapi.drgns.space",
    "https://api.piped.yt",
    "https://piped-api.lunar.icu",
    "https://pipedapi.tokhmi.xyz",
];

interface AudioExtractionResult {
    blob: Blob;
    filename: string;
}

/**
 * Attempts to download audio from a YouTube URL using client-side APIs.
 * Returns a Blob of the audio file if successful.
 */
export async function extractAudioFromUrl(url: string, onProgress?: (msg: string) => void): Promise<AudioExtractionResult | null> {
    // 1. Try Cobalt Instances
    for (const instance of COBALT_INSTANCES) {
        try {
            if (onProgress) onProgress(`Trying Cobalt instance: ${instance}...`);

            const payload = {
                url: url,
                audioFormat: "mp3",
                isAudioOnly: true,
            };

            // AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

            const response = await fetch(`${instance}/api/json`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) continue;

            const data = await response.json();

            // Some instances return different error structures
            if (data.status === "error" || ('text' in data && !data.url)) continue;
            if (!data.url) continue;

            // Found a download URL! Now fetch the blob
            if (onProgress) onProgress("Downloading audio file...");

            // Fetch audio blob (this might tricky if CORS is strict, but usually Cobalt is open)
            const audioRes = await fetch(data.url);
            if (!audioRes.ok) continue;

            const blob = await audioRes.blob();
            // Filename from header or fallback
            // Cobalt usually sends "filename" in JSON
            const filename = data.filename || "audio.mp3";

            return { blob, filename };

        } catch (e) {
            console.warn(`Cobalt instance ${instance} failed`, e);
        }
    }

    // 2. Try Piped Instances (Fallback)
    for (const instance of PIPED_INSTANCES) {
        try {
            if (onProgress) onProgress(`Trying Piped instance: ${instance}...`);

            // Extract Video ID
            const videoIdMatch = url.match(/(?:v=|\/)([\w-]{11})(?:\?|&|\/|$)/);
            if (!videoIdMatch) continue;
            const videoId = videoIdMatch[1];

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

            const response = await fetch(`${instance}/streams/${videoId}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) continue;

            const data = await response.json();

            // Find audio stream
            const audioStreams = data.audioStreams || [];
            // Prefer m4a or webm with highest bitrate
            const bestStream = audioStreams.find((s: { mimeType: string; url: string }) => s.mimeType.includes("audio/mp4") || s.mimeType.includes("audio/m4a"))
                || audioStreams[0];

            if (!bestStream) continue;

            if (onProgress) onProgress("Downloading audio from Piped...");
            const audioRes = await fetch(bestStream.url);
            if (!audioRes.ok) continue;

            const blob = await audioRes.blob();
            const filename = `${data.title || "audio"}.mp3`; // Piped doesn't give exact filename, we make one

            return { blob, filename };

        } catch (e) {
            console.warn(`Piped instance ${instance} failed`, e);
        }
    }

    return null;
}
