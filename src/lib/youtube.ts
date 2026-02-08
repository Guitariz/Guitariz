

interface AudioStream {
    url: string;
    format: string;
    quality: string;
}

const PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://api.piped.privacy.com.de",
    "https://pipedapi.drgns.space",
    "https://api.piped.yt",
    "https://pipedapi.kavin.rocks" // Duplicate for retry
];

const COBALT_INSTANCES = [
    "https://api.cobalt.tools",
    "https://cobalt.git.gay",
    "https://cobalt.maybreak.com"
];

export function extractVideoId(url: string): string | null {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

export interface YouTubeDownloadResult {
    file: File;
    title: string;
    duration: number; // seconds
    thumbnailUrl?: string;
}

export async function downloadYouTubeAudio(
    url: string,
    onProgress?: (msg: string) => void
): Promise<YouTubeDownloadResult> {
    const videoId = extractVideoId(url);
    if (!videoId) throw new Error("Invalid YouTube URL");

    // 1. Try Piped API
    for (const api of PIPED_INSTANCES) {
        try {
            if (onProgress) onProgress(`Fetching metadata from ${new URL(api).hostname}...`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const resp = await fetch(`${api}/streams/${videoId}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!resp.ok) continue;

            const data = await resp.json();
            const audioStreams: AudioStream[] = data.audioStreams;

            // Find M4A (usually works best with browser fetch)
            const stream = audioStreams.find(s => s.format === 'M4A') || audioStreams[0];

            if (stream) {
                if (onProgress) onProgress("Downloading audio stream...");

                // Fetch the actual audio file
                const audioResp = await fetch(stream.url);
                if (!audioResp.ok) throw new Error("Stream fetch failed");

                const blob = await audioResp.blob();
                const file = new File([blob], `${data.title || videoId}.m4a`, { type: 'audio/mp4' });

                return {
                    file,
                    title: data.title || videoId,
                    duration: data.duration || 0,
                    thumbnailUrl: data.thumbnailUrl
                };
            }
        } catch (e) {
            console.warn(`Piped ${api} failed:`, e);
        }
    }

    // 2. Try Cobalt API (Backup) -- Cobalt doesn't always return metadata
    for (const api of COBALT_INSTANCES) {
        try {
            if (onProgress) onProgress(`Trying Cobalt ${new URL(api).hostname}...`);

            const resp = await fetch(`${api}/api/json`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: url,
                    vCodec: "h264",
                    vQuality: "720",
                    aFormat: "mp3",
                    isAudioOnly: true
                })
            });

            if (!resp.ok) continue;
            const data = await resp.json();

            if (data.url) {
                if (onProgress) onProgress("Downloading from Cobalt...");
                const audioResp = await fetch(data.url);
                const blob = await audioResp.blob();
                const file = new File([blob], `${videoId}.mp3`, { type: 'audio/mpeg' });

                // Cobalt might not verify metadata in legacy mode
                return {
                    file,
                    title: `YouTube Video (${videoId})`,
                    duration: 0
                };
            }
        } catch (e) {
            console.warn(`Cobalt ${api} failed:`, e);
        }
    }

    throw new Error("All download methods failed. The video might be region-locked or private.");
}
