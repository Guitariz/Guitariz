import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { CIRCLE_KEYS } from "./circle-of-fifths/theoryData";
import { CircleWheel } from "./circle-of-fifths/CircleWheel";
import { KeyInspector } from "./circle-of-fifths/KeyInspector";
import { LessonController } from "./circle-of-fifths/LessonController";
import { AdvancedTheoryPanel } from "./circle-of-fifths/AdvancedTheoryPanel";
import { SmartSearch } from "./circle-of-fifths/SmartSearch";
import { ContextualFAB } from "./circle-of-fifths/ContextualFAB";
import { FloatingTips } from "./circle-of-fifths/FloatingTips";
import { playScale } from "./circle-of-fifths/audioSynth";
import { Search, Compass, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const CircleOfFifths = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramRoot = searchParams.get("root") || searchParams.get("key");
  const paramMode = searchParams.get("mode");

  // Read initial key from URL parameter if present, otherwise default to null
  const [selectedKey, setSelectedKey] = useState<string | null>(() => {
    if (paramRoot) {
      const match = CIRCLE_KEYS.find((k) => k.note.toLowerCase() === paramRoot.toLowerCase());
      if (match) return match.note;
    }
    return null;
  });

  // Default mode is Explore Mode unless specified in URL
  const [mode, setMode] = useState<"explore" | "learn">(
    paramMode === "learn" ? "learn" : "explore"
  );

  const [showRelativeMinor, setShowRelativeMinor] = useState(true);
  const [highlightKey, setHighlightKey] = useState<string | null>(null);
  const [targetHintText, setTargetHintText] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  const selectedKeyData = useMemo(() => {
    return CIRCLE_KEYS.find((k) => k.note === selectedKey);
  }, [selectedKey]);

  const handleKeySelect = useCallback((note: string | null) => {
    setSelectedKey(note);
    if (note) {
      setSearchParams({ root: note, mode });
    } else {
      setSearchParams({ mode });
    }
  }, [mode, setSearchParams]);

  const handleSetHighlightKey = useCallback((note: string | null, hintText: string | null) => {
    setHighlightKey(note);
    setTargetHintText(hintText);
  }, []);

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        return;
      }

      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        const currentPos = selectedKeyData?.position ?? 0;
        const nextPos = (currentPos + 1) % 12;
        const nextKey = CIRCLE_KEYS.find((k) => k.position === nextPos);
        if (nextKey) handleKeySelect(nextKey.note);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const currentPos = selectedKeyData?.position ?? 0;
        const prevPos = (currentPos + 11) % 12;
        const prevKey = CIRCLE_KEYS.find((k) => k.position === prevPos);
        if (prevKey) handleKeySelect(prevKey.note);
      } else if (e.key === " ") {
        e.preventDefault();
        if (selectedKeyData) playScale(selectedKeyData.majorScale);
      } else if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        setShowRelativeMinor((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeySelect, selectedKeyData]);

  return (
    <div className="w-full relative space-y-6">
      {/* Header Controls: Mode Switcher & Smart Search Trigger */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 text-xs font-medium">
          <button
            onClick={() => setMode("explore")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
              mode === "explore"
                ? "bg-primary text-primary-foreground font-semibold shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Compass className="w-4 h-4" />
            <span>○ Explore Mode</span>
          </button>
          <button
            onClick={() => setMode("learn")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
              mode === "learn"
                ? "bg-primary text-primary-foreground font-semibold shadow-md"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <BookOpen className="w-4 h-4" />
            <span>● Learn Mode</span>
          </button>
        </div>

        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/60 border border-white/10 hover:border-primary/40 text-xs text-muted-foreground hover:text-foreground transition-all shadow-sm group w-full sm:w-auto"
        >
          <Search className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
          <span>Search keys, scales, or modes...</span>
          <span className="ml-2 font-mono text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-foreground font-bold">
            Ctrl K
          </span>
        </button>
      </div>

      {/* Learn Mode Controller (Automated Tour & Quiz) */}
      {mode === "learn" && (
        <LessonController
          selectedKey={selectedKey}
          onSelectKeyNote={handleKeySelect}
          onSetHighlightKey={handleSetHighlightKey}
        />
      )}

      {/* Main Interactive Grid (Circle Wheel + Key Inspector) */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Circle Wheel */}
        <div className="lg:col-span-7">
          <CircleWheel
            keys={CIRCLE_KEYS}
            selectedKey={selectedKey}
            onSelectKey={handleKeySelect}
            showRelativeMinor={showRelativeMinor}
            onToggleRelativeMinor={() => setShowRelativeMinor(!showRelativeMinor)}
            isLearnMode={mode === "learn"}
            highlightKey={mode === "learn" ? highlightKey : null}
            targetHintText={mode === "learn" ? targetHintText : null}
          />
        </div>

        {/* Right Column: Key Inspector */}
        <div className="lg:col-span-5">
          <KeyInspector
            selectedKeyData={selectedKeyData}
            onSelectKeyNote={handleKeySelect}
          />
        </div>
      </div>

      {/* Professional Full-Width Advanced Theory Dashboard (Below Circle & Inspector) */}
      <AdvancedTheoryPanel
        selectedKeyData={selectedKeyData}
        onSelectKeyNote={handleKeySelect}
      />

      {/* Smart Search Command Dialog */}
      <SmartSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectKey={handleKeySelect}
      />

      {/* Contextual Floating Action Button */}
      <ContextualFAB
        onRestartTutorial={() => {
          setMode("learn");
          setSelectedKey("C");
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Non-intrusive Floating Tip */}
      <FloatingTips />
    </div>
  );
};

export default CircleOfFifths;
