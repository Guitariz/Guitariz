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

// CORS Proxies to bypass browser restrictions
const CORS_PROXIES = [
    "https://corsproxy.io/?",
    "https://api.allorigins.win/raw?url=",
    // "https://cors-anywhere.herokuapp.com/", // Often rate limited
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

    // 1. Try Piped Instances (Easier to proxy as they use GET)
    for (const instance of PIPED_INSTANCES) {
        try {
            // Extract Video ID
            const videoIdMatch = url.match(/(?:v=|\/)([\w-]{11})(?:\?|&|\/|$)/);
            if (!videoIdMatch) continue;
            const videoId = videoIdMatch[1];

            if (onProgress) onProgress(`Trying Piped instance: ${instance}...`);

            // Iterate through CORS proxies for each Piped instance
            for (const proxy of CORS_PROXIES) {
                try {
                    const targetUrl = `${instance}/streams/${videoId}`;
                    const proxiedUrl = `${proxy}${encodeURIComponent(targetUrl)}`;

                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

                    const response = await fetch(proxiedUrl, {
                        signal: controller.signal
                    });
                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        console.warn(`Piped proxy ${proxy} + ${instance} returned ${response.status}`);
                        continue;
                    }

                    const data = await response.json();

                    // Find audio stream
                    const audioStreams = data.audioStreams || [];
                    // Prefer m4a or webm with highest bitrate
                    const bestStream = audioStreams.find((s: { mimeType: string; url: string }) => s.mimeType.includes("audio/mp4") || s.mimeType.includes("audio/m4a"))
                        || audioStreams[0];

                    if (!bestStream) {
                        console.warn(`No audio streams found for ${instance} via ${proxy}`);
                        continue;
                    }

                    if (onProgress) onProgress("Downloading audio from Piped...");

                    // Proxy the download link too!
                    const audioTargetUrl = bestStream.url;
                    const proxiedAudioUrl = `${proxy}${encodeURIComponent(audioTargetUrl)}`;

                    const audioRes = await fetch(proxiedAudioUrl);
                    if (!audioRes.ok) continue;

                    const blob = await audioRes.blob();
                    const filename = `${data.title || "audio"}.mp3`;

                    return { blob, filename };

                } catch (e) {
                    // Try next proxy
                    console.warn(`Piped proxy error:`, e);
                    continue;
                }
            }

        } catch (e) {
            console.warn(`Piped instance ${instance} failed`, e);
        }
    }

    // 2. Try Cobalt Instances (Fallback)
    // We try to proxy the POST request using corsproxy.io which supports it
    const PROXY_FOR_POST = "https://corsproxy.io/?";

    for (const instance of COBALT_INSTANCES) {
        try {
            if (onProgress) onProgress(`Trying Cobalt instance: ${instance}...`);

            const payload = {
                url: url,
                audioFormat: "mp3",
                isAudioOnly: true,
            };

            // Strategy A: Direct attempt (some instances might allow CORS)
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
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

                if (response.ok) {
                    const data = await response.json();
                    if (data.status !== "error" && data.url) {
                        const audioRes = await fetch(data.url); // Try direct download
                        if (audioRes.ok) {
                            const blob = await audioRes.blob();
                            const filename = data.filename || "audio.mp3";
                            return { blob, filename };
                        }
                    }
                }
            } catch (e) {
                console.warn(`Direct Cobalt ${instance} failed, trying proxy...`);
            }

            // Strategy B: Proxy the POST request
            // fetch('https://corsproxy.io/?https://cobalt.../api/json', { method: 'POST', body: ... })
            try {
                const targetUrl = `${instance}/api/json`;
                const proxiedUrl = `${PROXY_FOR_POST}${encodeURIComponent(targetUrl)}`;

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);

                const response = await fetch(proxiedUrl, {
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
                if (data.status === "error" || !data.url) continue;

                // Download the file via proxy too
                if (onProgress) onProgress("Downloading audio from Cobalt...");

                const proxiedFileUrl = `${PROXY_FOR_POST}${encodeURIComponent(data.url)}`;
                const audioRes = await fetch(proxiedFileUrl);
                if (!audioRes.ok) continue;

                const blob = await audioRes.blob();
                const filename = data.filename || "audio.mp3";

                return { blob, filename };

            } catch (e) {
                console.warn(`Proxied Cobalt ${instance} failed`, e);
            }

        } catch (e) {
            console.warn(`Cobalt instance ${instance} failed`, e);
        }
    }

    return null;
}
