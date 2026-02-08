import { useRef, useState, useEffect, useCallback } from "react";
import YouTube, { YouTubePlayer as YTPlayer, YouTubeEvent } from "react-youtube";
import { Button } from "@/components/ui/button";
import {
    Play,
    Pause,
    PictureInPicture2,
    Maximize2,
    Minimize2,
    Volume2,
    VolumeX,
    X,
    GripHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

interface YouTubePlayerProps {
    videoId: string;
    onTimeUpdate?: (currentTime: number) => void;
    onReady?: () => void;
    onEnd?: () => void;
    className?: string;
    initialPiP?: boolean;
}

export default function YouTubePlayer({
    videoId,
    onTimeUpdate,
    onReady,
    onEnd,
    className,
    initialPiP = false,
}: YouTubePlayerProps) {
    const playerRef = useRef<YTPlayer | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isPiP, setIsPiP] = useState(initialPiP);
    const [isNativePiP, setIsNativePiP] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Draggable PiP state
    const [pipPosition, setPipPosition] = useState({ x: 20, y: 20 });
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });

    // Time update polling
    useEffect(() => {
        if (isPlaying && playerRef.current) {
            intervalRef.current = setInterval(() => {
                const time = playerRef.current?.getCurrentTime?.() || 0;
                setCurrentTime(time);
                onTimeUpdate?.(time);
            }, 250); // Update every 250ms for smooth sync
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isPlaying, onTimeUpdate]);

    const handleReady = (event: YouTubeEvent) => {
        playerRef.current = event.target;
        setDuration(event.target.getDuration());
        setIsLoading(false);
        onReady?.();
    };

    const handleStateChange = (event: YouTubeEvent) => {
        // YouTube player states: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
        setIsPlaying(event.data === 1);
        if (event.data === 0) {
            onEnd?.();
        }
    };

    const togglePlay = useCallback(() => {
        if (!playerRef.current) return;
        if (isPlaying) {
            playerRef.current.pauseVideo();
        } else {
            playerRef.current.playVideo();
        }
    }, [isPlaying]);

    const toggleMute = useCallback(() => {
        if (!playerRef.current) return;
        if (isMuted) {
            playerRef.current.unMute();
        } else {
            playerRef.current.mute();
        }
        setIsMuted(!isMuted);
    }, [isMuted]);

    const seekTo = useCallback((time: number) => {
        playerRef.current?.seekTo(time, true);
        setCurrentTime(time);
        onTimeUpdate?.(time);
    }, [onTimeUpdate]);

    // Native Picture-in-Picture
    const toggleNativePiP = useCallback(async () => {
        try {
            const iframe = containerRef.current?.querySelector("iframe");
            if (!iframe) return;

            // The iframe needs to support PiP - this may not work on all browsers
            // Fall back to custom PiP mode
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                setIsNativePiP(false);
            } else {
                // Native PiP on iframes is limited, use custom PiP instead
                setIsPiP(true);
            }
        } catch (error) {
            // Fall back to custom PiP
            setIsPiP(true);
        }
    }, []);

    // Custom draggable PiP mode
    const toggleCustomPiP = useCallback(() => {
        setIsPiP(!isPiP);
    }, [isPiP]);

    // Drag handlers for custom PiP
    const handleDragStart = (e: React.MouseEvent) => {
        setIsDragging(true);
        const rect = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect();
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const maxX = window.innerWidth - 320;
            const maxY = window.innerHeight - 180;
            setPipPosition({
                x: Math.max(0, Math.min(maxX, e.clientX - dragOffset.current.x)),
                y: Math.max(0, Math.min(maxY, e.clientY - dragOffset.current.y)),
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const opts = {
        height: "100%",
        width: "100%",
        playerVars: {
            autoplay: 0,
            controls: 0, // Hide YouTube controls for custom UI
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            fs: 0,
            origin: window.location.origin,
        },
    };

    // Custom PiP floating player
    if (isPiP) {
        return (
            <div
                className="fixed z-50 shadow-2xl rounded-xl overflow-hidden border border-white/20 bg-black"
                style={{
                    left: pipPosition.x,
                    top: pipPosition.y,
                    width: 320,
                    height: 180,
                }}
            >
                {/* Drag handle */}
                <div
                    className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-center justify-between px-2 cursor-move"
                    onMouseDown={handleDragStart}
                >
                    <div className="flex items-center gap-1 text-white/60">
                        <GripHorizontal className="w-4 h-4" />
                        <span className="text-xs">YouTube</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                            onClick={toggleCustomPiP}
                        >
                            <Maximize2 className="w-3 h-3" />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-white/60 hover:text-white hover:bg-white/10"
                            onClick={() => setIsPiP(false)}
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                </div>

                {/* Player */}
                <div ref={containerRef} className="w-full h-full relative">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        </div>
                    )}
                    <YouTube
                        key={videoId}
                        videoId={videoId}
                        opts={opts}
                        onReady={handleReady}
                        onStateChange={handleStateChange}
                        onError={(e: YouTubeEvent) => console.error("YouTube Player Error:", e.data)}
                    />
                </div>

                {/* Mini controls */}
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/90 to-transparent z-10 flex items-center justify-center gap-2 px-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-white hover:bg-white/20"
                        onClick={togglePlay}
                    >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <span className="text-xs text-white/80 font-mono">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                </div>
            </div>
        );
    }

    // Normal embedded player
    return (
        <div className={cn("rounded-xl overflow-hidden bg-black relative group", className)}>
            <div ref={containerRef} className="aspect-video w-full relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
                        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                )}
                <YouTube
                    key={videoId}
                    videoId={videoId}
                    opts={opts}
                    onReady={handleReady}
                    onStateChange={handleStateChange}
                    onError={(e: YouTubeEvent) => console.error("YouTube Player Error:", e.data)}
                    className="w-full h-full"
                />
            </div>

            {/* Custom controls overlay */}
            <div className="absolute inset-0 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {/* Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                {/* Progress bar */}
                <div className="relative px-4 mb-2">
                    <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={(e) => seekTo(Number(e.target.value))}
                        className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:scale-125 [&::-webkit-slider-thumb]:transition-transform"
                        style={{
                            background: `linear-gradient(to right, white ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%)`,
                        }}
                    />
                </div>

                {/* Control buttons */}
                <div className="relative z-10 flex items-center justify-between px-4 pb-3">
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 w-9 p-0 text-white hover:bg-white/20"
                            onClick={togglePlay}
                        >
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 w-9 p-0 text-white hover:bg-white/20"
                            onClick={toggleMute}
                        >
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </Button>
                        <span className="text-sm text-white/80 font-mono ml-2">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 w-9 p-0 text-white hover:bg-white/20"
                            onClick={toggleCustomPiP}
                            title="Mini player"
                        >
                            <Minimize2 className="w-5 h-5" />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 w-9 p-0 text-white hover:bg-white/20"
                            onClick={toggleNativePiP}
                            title="Picture-in-Picture"
                        >
                            <PictureInPicture2 className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Click to play overlay when paused */}
            {!isPlaying && (
                <div
                    className="absolute inset-0 flex items-center justify-center cursor-pointer z-5"
                    onClick={togglePlay}
                >
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                        <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                </div>
            )}
        </div>
    );
}

// Export types and utilities
export { YouTubePlayer };
export type { YouTubePlayerProps };
