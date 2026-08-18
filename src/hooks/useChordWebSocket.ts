/**
 * src/hooks/useChordWebSocket.ts
 *
 * WebSocket client for real-time microphone chord detection.
 *
 * Connects to the backend's /ws/chords endpoint, streams PCM audio
 * from the microphone, and receives chord predictions in real-time.
 */

import { useState, useRef, useCallback, useEffect } from "react";

interface ChordResult {
  chord: string;
  confidence: number;
  pitchClasses: number[];
}

export function useChordWebSocket() {
  const [connected, setConnected] = useState(false);
  const [currentChord, setCurrentChord] = useState<ChordResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const connect = useCallback(async () => {
    try {
      setError(null);

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 44100, echoCancellation: true },
      });
      streamRef.current = stream;

      // Set up audio processing
      const ctx = new AudioContext({ sampleRate: 44100 });
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // Connect WebSocket
      const apiUrl = (
        import.meta.env.VITE_CHORD_AI_API
          ? new URL(import.meta.env.VITE_CHORD_AI_API).origin
          : import.meta.env.VITE_API_URL || "http://localhost:7860"
      ).replace(/\/+$/, "").replace("https://", "wss://").replace("http://", "ws://");

      const ws = new WebSocket(`${apiUrl}/ws/chords`);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        console.log("[WS] Connected for live chord detection");

        // Start sending audio
        processor.onaudioprocess = (e) => {
          if (ws.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            const buffer = new Float32Array(inputData);
            ws.send(buffer.buffer);
          }
        };

        source.connect(processor);
        processor.connect(ctx.destination);
      };

      ws.onmessage = (event) => {
        try {
          const result = JSON.parse(event.data) as ChordResult;
          setCurrentChord(result);
        } catch {
          console.warn("[WS] Failed to parse chord result");
        }
      };

      ws.onerror = () => {
        setError("WebSocket connection error");
        setConnected(false);
      };

      ws.onclose = () => {
        setConnected(false);
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to access microphone";
      setError(msg);
      setConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setConnected(false);
    setCurrentChord(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { disconnect(); };
  }, [disconnect]);

  return { connected, currentChord, error, connect, disconnect };
}
