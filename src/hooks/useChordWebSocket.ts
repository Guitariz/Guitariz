/**
 * WebSocket Hook for Real-time Chord Detection
 * Connects to backend WebSocket and streams audio for chord analysis
 */

import { useState, useEffect, useCallback, useRef } from "react";

interface ChordResult {
    chord: string;
    confidence: number;
    timestamp: number;
}

interface WebSocketMessage {
    type: string;
    chord?: string;
    confidence?: number;
    timestamp?: number;
}

const BACKEND_WS_URL = import.meta.env.VITE_BACKEND_WS_URL || "ws://localhost:7860";

export const useChordWebSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [currentChord, setCurrentChord] = useState<ChordResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const clientIdRef = useRef<string>(`client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttemptsRef = useRef(0);

    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 2000;

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            const wsUrl = `${BACKEND_WS_URL}/ws/chords/${clientIdRef.current}`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setIsConnected(true);
                setError(null);
                reconnectAttemptsRef.current = 0;
            };

            ws.onmessage = (event) => {
                try {
                    const data: WebSocketMessage = JSON.parse(event.data);

                    if (data.type === "chord" && data.chord) {
                        setCurrentChord({
                            chord: data.chord,
                            confidence: data.confidence || 0,
                            timestamp: data.timestamp || 0,
                        });
                    } else if (data.type === "pong") {
                        // Keepalive response
                    }
                } catch (e) {
                    console.error("[WS] Parse error:", e);
                }
            };

            ws.onerror = (e) => {
                console.error("[WS] Error:", e);
                setError("WebSocket connection error");
            };

            ws.onclose = () => {
                setIsConnected(false);
                wsRef.current = null;

                // Attempt reconnection
                if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttemptsRef.current++;
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, RECONNECT_DELAY * reconnectAttemptsRef.current);
                } else {
                    setError("Failed to connect after multiple attempts");
                }
            };
        } catch (e) {
            console.error("[WS] Connection error:", e);
            setError("Failed to create WebSocket connection");
        }
    }, []);

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setIsConnected(false);
        reconnectAttemptsRef.current = MAX_RECONNECT_ATTEMPTS; // Prevent auto-reconnect
    }, []);

    const sendAudioChunk = useCallback((audioData: Float32Array, timestamp: number) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return false;
        }

        try {
            // Convert Float32Array to 16-bit PCM
            const pcmData = new Int16Array(audioData.length);
            for (let i = 0; i < audioData.length; i++) {
                const s = Math.max(-1, Math.min(1, audioData[i]));
                pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }

            // Convert to base64
            const bytes = new Uint8Array(pcmData.buffer);
            const base64 = btoa(String.fromCharCode(...bytes));

            wsRef.current.send(JSON.stringify({
                type: "audio_chunk",
                data: base64,
                timestamp,
            }));

            return true;
        } catch (e) {
            console.error("[WS] Send error:", e);
            return false;
        }
    }, []);

    const clearBuffer = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "clear" }));
        }
        setCurrentChord(null);
    }, []);

    const ping = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "ping" }));
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        isConnected,
        currentChord,
        error,
        connect,
        disconnect,
        sendAudioChunk,
        clearBuffer,
        ping,
    };
};

export default useChordWebSocket;
