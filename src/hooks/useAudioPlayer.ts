import { useCallback, useEffect, useRef, useState } from "react";

export type Peaks = number[];

export type AudioFileInfo = {
  name: string;
  duration: number;
};

export type UseAudioPlayer = {
  loadFile: (file: File | null, buffer?: AudioBuffer) => Promise<void>;
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
  transpose: number;
  setTranspose: (semitones: number) => void;
  tempo: number;
  setTempo: (rate: number) => void;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const computePeaks = (audioBuffer: AudioBuffer, buckets = 400): Peaks => {
  const channelData = audioBuffer.getChannelData(0);
  const blockSize = Math.max(1, Math.floor(channelData.length / buckets));
  const peaks: number[] = [];
  for (let i = 0; i < buckets; i += 1) {
    const start = i * blockSize;
    const end = Math.min(start + blockSize, channelData.length);
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
  const [transpose, setTranspose] = useState<number>(0);
  const [tempo, setTempo] = useState<number>(1.0);

  // Update detune and playbackRate in real-time
  useEffect(() => {
    if (sourceRef.current) {
      sourceRef.current.detune.setValueAtTime(transpose * 100, audioCtxRef.current?.currentTime || 0);
    }
  }, [transpose]);

  useEffect(() => {
    if (sourceRef.current) {
      sourceRef.current.playbackRate.setValueAtTime(tempo, audioCtxRef.current?.currentTime || 0);
    }
  }, [tempo]);

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

    // If we're at the end, reset to beginning
    if (offsetRef.current >= duration) {
      offsetRef.current = 0;
    }

    teardownSource();

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.detune.value = transpose * 100;
    source.playbackRate.value = tempo;
    const gain = gainRef.current || ctx.createGain();
    gainRef.current = gain;
    source.connect(gain);
    gain.connect(ctx.destination);

    startTimeRef.current = ctx.currentTime;
    source.start(0, offsetRef.current);
    sourceRef.current = source;
    setIsPlaying(true);

    source.onended = () => {
      // Only mark as ended if we actually played to the end (not stopped manually)
      if (offsetRef.current + (ctx.currentTime - startTimeRef.current) >= duration - 0.1) {
        setIsPlaying(false);
        offsetRef.current = duration;
        setCurrentTime(duration);
      }
    };
  }, [audioBuffer, duration, transpose, tempo]);

  const seek = useCallback(
    (time: number) => {
      if (!audioBuffer) return;
      const clamped = clamp(time, 0, duration);
      offsetRef.current = clamped;
      setCurrentTime(clamped);

      // If currently playing, restart playback from new position
      if (isPlaying) {
        teardownSource();
        const ctx = audioCtxRef.current!;
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.detune.value = transpose * 100;
        source.playbackRate.value = tempo;
        const gain = gainRef.current || ctx.createGain();
        gainRef.current = gain;
        source.connect(gain);
        gain.connect(ctx.destination);

        startTimeRef.current = ctx.currentTime;
        source.start(0, offsetRef.current);
        sourceRef.current = source;

        source.onended = () => {
          if (offsetRef.current + (ctx.currentTime - startTimeRef.current) >= duration - 0.1) {
            setIsPlaying(false);
            offsetRef.current = duration;
            setCurrentTime(duration);
          }
        };
      }
    },
    [audioBuffer, duration, isPlaying, transpose, tempo],
  );

  const loadFile = useCallback(async (file: File | null, buffer?: AudioBuffer) => {
    try {
      setError(null);
      stopRaf();

      // Stop any playing audio first
      if (isPlaying) {
        teardownSource();
        setIsPlaying(false);
      }

      const ctx = audioCtxRef.current || new AudioContext();
      audioCtxRef.current = ctx;

      let decoded: AudioBuffer;
      let fileName = "instrumental.wav";

      // If buffer is provided directly, use it
      if (buffer) {
        decoded = buffer;
        fileName = fileInfo?.name || "instrumental.wav";
      }
      // Otherwise decode from file
      else if (file) {
        const arrayBuffer = await file.arrayBuffer();
        decoded = await ctx.decodeAudioData(arrayBuffer);
        fileName = file.name;
      } else {
        throw new Error("Either file or buffer must be provided");
      }

      setAudioBuffer(decoded);
      setDuration(decoded.duration);
      setFileInfo({ name: fileName, duration: decoded.duration });
      offsetRef.current = 0;
      setCurrentTime(0);
      setPeaks(computePeaks(decoded));
    } catch (err) {
      console.error(err);
      setError("Failed to load or decode audio.");
    }
  }, [isPlaying, fileInfo]);

  useEffect(() => {
    if (isPlaying) {
      updateClock();
    } else {
      stopRaf();
    }
    return () => stopRaf();
  }, [isPlaying, updateClock]);

  // Update detune when transpose changes while playing
  useEffect(() => {
    if (sourceRef.current) {
      sourceRef.current.detune.value = transpose * 100;
    }
  }, [transpose]);

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
    transpose,
    setTranspose,
    tempo,
    setTempo,
  };
};

export default useAudioPlayer;
