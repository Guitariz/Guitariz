// List of available Cobalt/Piped instances (Client-Side)
const COBALT_INSTANCES = [
    "https://cobalt.git.gay",
    "https://cobalt.maybreak.com",
    "https://cobalt.api.kwiatekmiki.pl",
    "https://cobalt.tools", // Often requires turnstile
    "https://api.cobalt.tools",
];

// const PIPED_INSTANCES = [
//     "https://pipedapi.kavin.rocks",
//     "https://api.piped.privacy.com.de",
//     "https://pipedapi.drgns.space",
//     "https://api.piped.yt",
// ];

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

            const response = await fetch(`${instance}/api/json`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) continue;

            const data = await response.json();

            if (data.status === "error" || !data.url) continue;

            // Found a download URL! Now fetch the blob
            if (onProgress) onProgress("Downloading audio file...");
            const audioRes = await fetch(data.url);
            if (!audioRes.ok) continue;

            const blob = await audioRes.blob();
            // Filename from header or fallback
            const filename = data.filename || "audio.mp3";

            return { blob, filename };

        } catch (e) {
            console.warn(`Cobalt instance ${instance} failed`, e);
        }
    }

    // 2. Try Piped Instances
    // TODO: Implement Piped fallback if needed (Cobalt is usually better for direct download links)

    return null;
}
