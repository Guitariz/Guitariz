import { useState, useEffect } from "react";
import { FLOATING_TIPS } from "./theoryData";
import { X } from "lucide-react";

export const FloatingTips = () => {
  const [tipIndex, setTipIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Pick random tip on mount
    const rand = Math.floor(Math.random() * FLOATING_TIPS.length);
    setTipIndex(rand);
  }, []);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-6 left-6 z-30 max-w-xs w-full p-3.5 rounded-2xl bg-card/90 border border-white/20 shadow-2xl backdrop-blur-md text-foreground animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {FLOATING_TIPS[tipIndex]}
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground p-0.5 shrink-0"
          title="Dismiss tip"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
