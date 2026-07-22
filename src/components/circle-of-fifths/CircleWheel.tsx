import { useState } from "react";
import { CircleKeyData } from "./theoryData";
import { cn } from "@/lib/utils";
import { Sparkles, ArrowRight, ArrowLeft } from "lucide-react";

interface CircleWheelProps {
  keys: CircleKeyData[];
  selectedKey: string | null;
  onSelectKey: (note: string | null) => void;
  showRelativeMinor: boolean;
  onToggleRelativeMinor: () => void;
  isLearnMode: boolean;
  highlightKey?: string | null;
  targetHintText?: string | null;
}

export const CircleWheel = ({
  keys,
  selectedKey,
  onSelectKey,
  showRelativeMinor,
  onToggleRelativeMinor,
  isLearnMode,
  highlightKey,
  targetHintText,
}: CircleWheelProps) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const selectedKeyData = keys.find((k) => k.note === selectedKey);

  // Position calculation helper (0 to 11 on clock face)
  const getCoordinates = (position: number, radiusPct: number) => {
    const angle = (position * 30 - 90) * (Math.PI / 180);
    const x = 50 + radiusPct * Math.cos(angle);
    const y = 50 + radiusPct * Math.sin(angle);
    return { x, y };
  };

  // Find related keys for selected key
  const selectedPos = selectedKeyData?.position ?? 0;
  const dominantKey = keys.find((k) => k.position === (selectedPos + 1) % 12);
  const subdominantKey = keys.find((k) => k.position === (selectedPos + 11) % 12);

  const selectedCoords = selectedKeyData ? getCoordinates(selectedKeyData.position, 40) : null;
  const dominantCoords = dominantKey ? getCoordinates(dominantKey.position, 40) : null;
  const subdominantCoords = subdominantKey ? getCoordinates(subdominantKey.position, 40) : null;

  return (
    <div className="flex flex-col items-center w-full space-y-4">
      {/* Directional Header Bar - Placed ABOVE the wheel container to avoid ANY overlap with Key C */}
      <div className="w-full grid grid-cols-2 gap-2 text-[11px] font-medium">
        <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-300">
          <ArrowRight className="w-3.5 h-3.5" />
          <span>Clockwise (+5th): +1 Sharp</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-amber-950/40 border border-amber-500/20 text-amber-300">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Counter (+4th): +1 Flat</span>
        </div>
      </div>

      {/* Main Wheel Container with extra padding to prevent edge clipping */}
      <div className="relative aspect-square max-w-[480px] w-full mx-auto select-none my-2">
        {/* Architectural Rings */}
        <div className="absolute inset-2 rounded-full border-2 border-white/10 pointer-events-none" />
        <div className="absolute inset-[20%] rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute inset-[38%] rounded-full border border-dashed border-white/10 pointer-events-none" />

        {/* SVG Connector Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <linearGradient id="dominantGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.8)" />
              <stop offset="100%" stopColor="rgba(16, 185, 129, 0.8)" />
            </linearGradient>
            <linearGradient id="subdominantGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.8)" />
              <stop offset="100%" stopColor="rgba(245, 158, 11, 0.8)" />
            </linearGradient>
          </defs>

          {selectedKeyData && selectedCoords && (
            <>
              {/* Line to Dominant (+5th) */}
              {dominantCoords && (
                <path
                  d={`M ${selectedCoords.x}% ${selectedCoords.y}% Q 50% 50% ${dominantCoords.x}% ${dominantCoords.y}%`}
                  fill="none"
                  stroke="url(#dominantGrad)"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                  className="animate-[dash_15s_linear_infinite]"
                />
              )}

              {/* Line to Subdominant (+4th) */}
              {subdominantCoords && (
                <path
                  d={`M ${selectedCoords.x}% ${selectedCoords.y}% Q 50% 50% ${subdominantCoords.x}% ${subdominantCoords.y}%`}
                  fill="none"
                  stroke="url(#subdominantGrad)"
                  strokeWidth="3"
                  strokeDasharray="6 4"
                  className="animate-[dash_15s_linear_infinite]"
                />
              )}
            </>
          )}
        </svg>

        {/* Center Display / Empty State */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            onClick={() => onSelectKey(null)}
            className={cn(
              "w-36 h-36 rounded-full border backdrop-blur-xl flex flex-col items-center justify-center text-center p-3 pointer-events-auto transition-all cursor-pointer shadow-xl z-20",
              selectedKey
                ? "bg-card/90 border-white/20 hover:border-white/40 hover:scale-105"
                : "bg-primary/10 border-primary/30 animate-pulse hover:bg-primary/20"
            )}
          >
            {selectedKeyData ? (
              <>
                <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Selected Key</div>
                <div className="text-4xl font-light text-foreground tracking-tighter tabular-nums">
                  {selectedKeyData.note}
                </div>
                <div className="text-[10px] text-primary font-medium mt-1">
                  Rel: {selectedKeyData.relativeMinor}
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5">
                  {selectedKeyData.sharps > 0 && `${selectedKeyData.sharps} Sharp${selectedKeyData.sharps > 1 ? "s" : ""}`}
                  {selectedKeyData.flats > 0 && `${selectedKeyData.flats} Flat${selectedKeyData.flats > 1 ? "s" : ""}`}
                  {selectedKeyData.sharps === 0 && selectedKeyData.flats === 0 && "Natural (0 ♯/♭)"}
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <Sparkles className="w-6 h-6 text-primary mx-auto animate-spin-slow opacity-80" />
                <div className="text-xs font-semibold text-foreground">Welcome!</div>
                <div className="text-[10px] text-muted-foreground leading-tight">
                  Click any key on the wheel to start exploring
                </div>
                <div className="text-[9px] text-primary font-bold pt-1">[ Click C ]</div>
              </div>
            )}
          </div>
        </div>

        {/* 12 Key Buttons on Circumference */}
        {keys.map((k) => {
          const { x, y } = getCoordinates(k.position, 40);
          const isActive = selectedKey === k.note;
          const isHighlighted = highlightKey === k.note;
          const isDominant = selectedKeyData?.dominantKey === k.note;
          const isSubdominant = selectedKeyData?.subdominantKey === k.note;
          const isHovered = hoveredKey === k.note;

          return (
            <div
              key={k.note}
              className="absolute"
              style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
            >
              {/* Highlight Target Beacon Ring in Lesson Mode */}
              {isHighlighted && (
                <div className="absolute -inset-2 rounded-2xl border-2 border-primary animate-ping pointer-events-none" />
              )}

              {/* Target Hint Pointer Callout */}
              {isHighlighted && targetHintText && (
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg z-30 animate-bounce">
                  {targetHintText}
                </div>
              )}

              <button
                onMouseEnter={() => setHoveredKey(k.note)}
                onMouseLeave={() => setHoveredKey(null)}
                onClick={() => onSelectKey(k.note)}
                className={cn(
                  "w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 relative group z-10",
                  isActive
                    ? "bg-white text-black shadow-[0_0_35px_rgba(255,255,255,0.4)] scale-125 z-30 font-bold border-2 border-white"
                    : isHighlighted
                    ? "bg-primary text-primary-foreground border-2 border-primary shadow-[0_0_25px_rgba(var(--primary),0.6)] scale-125 z-30 animate-pulse"
                    : isDominant
                    ? "bg-emerald-500/20 border-2 border-emerald-400/60 text-emerald-200 hover:scale-110 shadow-lg"
                    : isSubdominant
                    ? "bg-amber-500/20 border-2 border-amber-400/60 text-amber-200 hover:scale-110 shadow-lg"
                    : "bg-card/40 border border-white/10 text-muted-foreground hover:border-white/30 hover:text-foreground hover:scale-110 hover:bg-card/80"
                )}
              >
                <span className="text-sm sm:text-base font-bold tracking-tight">{k.note}</span>

                {showRelativeMinor && (
                  <span className={cn("text-[9px] font-medium opacity-80", isActive ? "text-black/80" : "text-primary/90")}>
                    {k.relativeMinor}
                  </span>
                )}

                {!showRelativeMinor && (k.sharps > 0 || k.flats > 0) && (
                  <span className={cn("text-[8px] opacity-70", isActive ? "text-black/70" : "text-muted-foreground")}>
                    {k.sharps > 0 ? `${k.sharps}♯` : `${k.flats}♭`}
                  </span>
                )}

                {/* Hover Education Tooltip */}
                {isHovered && !isHighlighted && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap z-50 bg-black/90 backdrop-blur-md text-white text-[11px] px-3 py-1.5 rounded-lg border border-white/20 shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                    <div className="font-semibold text-primary">{k.note} Major</div>
                    <div className="text-[10px] text-muted-foreground">
                      {k.sharps > 0 ? `${k.sharps} Sharps (${k.keySignature.join(", ")})` : k.flats > 0 ? `${k.flats} Flats (${k.keySignature.join(", ")})` : "0 Accidentals"}
                    </div>
                    <div className="text-[9px] text-white/80 italic mt-0.5">{k.summary}</div>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer controls below wheel */}
      <div className="w-full flex items-center justify-between px-2 pt-2 text-xs text-muted-foreground">
        <button
          onClick={onToggleRelativeMinor}
          className="hover:text-foreground transition-colors flex items-center gap-2"
        >
          <div
            className={cn(
              "w-8 h-4 rounded-full transition-colors relative",
              showRelativeMinor ? "bg-primary/40 border border-primary/60" : "bg-white/10"
            )}
          >
            <div
              className={cn(
                "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm",
                showRelativeMinor ? "left-4 bg-primary" : "left-0.5"
              )}
            />
          </div>
          Show Minor Keys ({showRelativeMinor ? "On" : "Off"})
        </button>

        <span className="text-[11px] opacity-70">
          {selectedKeyData ? `${selectedKeyData.note} Major Selected` : "Click any key"}
        </span>
      </div>
    </div>
  );
};
