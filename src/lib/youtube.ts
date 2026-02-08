

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
    "https://pipedapi.kavin.rocks",
    "https://api.piped.otp.xyz",
    "https://api.piped.projectsegfau.lt",
    "https://pipedapi.adminforge.de",
    "https://api.piped.r4fo.com"
];

const COBALT_INSTANCES = [
    "https://api.cobalt.tools",
    "https://cobalt.git.gay",
    "https://cobalt.maybreak.com",
    "https://cobalt.tools"
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
            if (onProgress) onProgress(`Trying Piped (${new URL(api).hostname})...`);
            // Short timeout for metadata fetch
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);

            const resp = await fetch(`${api}/streams/${videoId}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!resp.ok) continue;

            const data = await resp.json();
            const audioStreams: AudioStream[] = data.audioStreams || [];

            // Find M4A (usually works best) or any audio
            const stream = audioStreams.find(s => s.format === 'M4A') || audioStreams[0];

            if (stream) {
                if (onProgress) onProgress("Downloading audio...");
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
            console.warn(`Piped ${api} failed`);
        }
    }

    // 2. Try Cobalt API (Backup)
    // We try both v7 (legacy) and v10 payload structures
    for (const api of COBALT_INSTANCES) {
        try {
            if (onProgress) onProgress(`Trying Cobalt (${new URL(api).hostname})...`);

            // Payload strategies
            const strategies = [
                // v10 style -> POST /
                {
                    endpoint: "/",
                    payload: {
                        url: url,
                        downloadMode: "audio",
                        audioFormat: "mp3"
                    }
                },
                // v7 style -> POST /api/json
                {
                    endpoint: "/api/json",
                    payload: {
                        url: url,
                        isAudioOnly: true,
                        aFormat: "mp3"
                    }
                }
            ];

            for (const { endpoint, payload } of strategies) {
                try {
                    const resp = await fetch(`${api}${endpoint}`, {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    if (!resp.ok) continue;
                    const data = await resp.json();

                    const downloadUrl = data.url || data.stream;
                    if (downloadUrl) {
                        if (onProgress) onProgress("Downloading from Cobalt...");
                        const audioResp = await fetch(downloadUrl);
                        const blob = await audioResp.blob();
                        const file = new File([blob], `${videoId}.mp3`, { type: 'audio/mpeg' });

                        return {
                            file,
                            title: `YouTube Video (${videoId})`,
                            duration: 0,
                            thumbnailUrl: undefined
                        };
                    }
                } catch (innerE) {
                    // try next strategy
                }
            }
        } catch (e) {
            console.warn(`Cobalt ${api} failed`);
        }
    }

    throw new Error("All download methods failed. The video might be region-locked to your IP or protected.");
}
