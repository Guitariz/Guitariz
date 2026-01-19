import { useCallback, useEffect, useRef, useState } from "react";

export type Peaks = number[];

export type AudioFileInfo = {
  name: string;
  duration: number;
};

export type UseAudioPlayer = {
  loadFile: (file: File) => Promise<void>;
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  audioBuffer: AudioBuffer | null;
  peaks: Peaks;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  fileInfo: AudioFileInfo | null;
  error: string | null;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const computePeaks = (audioBuffer: AudioBuffer, buckets = 400): Peaks => {
  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.max(1, Math.floor(channelData.length / buckets));
  const peaks: number[] = [];
  for (let i = 0; i < buckets; i += 1) {
    let start = i * blockSize;
    let end = Math.min(start + blockSize, channelData.length);
    let max = 0;
    for (let j = start; j < end; j += 1) {
      max = Math.max(max, Math.abs(channelData[j]));
    }
    peaks.push(max);
  }
  return peaks;
};

export const useAudioPlayer = (): UseAudioPlayer => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);

  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [peaks, setPeaks] = useState<Peaks>([]);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [fileInfo, setFileInfo] = useState<AudioFileInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopRaf = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const updateClock = useCallback(() => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const now = offsetRef.current + (isPlaying ? ctx.currentTime - startTimeRef.current : 0);
    setCurrentTime(clamp(now, 0, duration));
    rafRef.current = requestAnimationFrame(updateClock);
  }, [duration, isPlaying]);

  const teardownSource = () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop(0);
      } catch (err) {
        // ignore
      }
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
  };

  const pause = useCallback(() => {
    if (!audioCtxRef.current) return;
    if (!isPlaying) return;
    const ctx = audioCtxRef.current;
    const elapsed = ctx.currentTime - startTimeRef.current;
    offsetRef.current = clamp(offsetRef.current + elapsed, 0, duration);
    teardownSource();
    setIsPlaying(false);
  }, [duration, isPlaying]);

  const play = useCallback(() => {
    if (!audioBuffer) return;
    const ctx = audioCtxRef.current || new AudioContext();
    audioCtxRef.current = ctx;

    teardownSource();

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    const gain = gainRef.current || ctx.createGain();
    gainRef.current = gain;
    source.connect(gain);
    gain.connect(ctx.destination);

    startTimeRef.current = ctx.currentTime;
    source.start(0, offsetRef.current);
    sourceRef.current = source;
    setIsPlaying(true);

    source.onended = () => {
      setIsPlaying(false);
      offsetRef.current = duration;
    };
  }, [audioBuffer, duration]);

  const seek = useCallback(
    (time: number) => {
      if (!audioBuffer) return;
      const clamped = clamp(time, 0, duration);
      offsetRef.current = clamped;
      setCurrentTime(clamped);
      if (isPlaying) {
        play();
      }
    },
    [audioBuffer, duration, isPlaying, play],
  );

  const loadFile = useCallback(async (file: File) => {
    try {
      setError(null);
      stopRaf();
      pause();

      const ctx = audioCtxRef.current || new AudioContext();
      audioCtxRef.current = ctx;
      const arrayBuffer = await file.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arrayBuffer);
      setAudioBuffer(decoded);
      setDuration(decoded.duration);
      setFileInfo({ name: file.name, duration: decoded.duration });
      offsetRef.current = 0;
      setCurrentTime(0);
      setPeaks(computePeaks(decoded));
    } catch (err) {
      console.error(err);
      setError("Failed to load or decode audio.");
    }
  }, [pause]);

  useEffect(() => {
    if (isPlaying) {
      updateClock();
    } else {
      stopRaf();
    }
    return () => stopRaf();
  }, [isPlaying, updateClock]);

  useEffect(() => {
    return () => {
      stopRaf();
      teardownSource();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return {
    loadFile,
    play,
    pause,
    seek,
    audioBuffer,
    peaks,
    duration,
    currentTime,
    isPlaying,
    fileInfo,
    error,
  };
};

export default useAudioPlayer;
