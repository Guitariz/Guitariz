import { useState } from "react";
import { HelpCircle, RotateCcw, Keyboard, BookOpen, Trophy, Sparkles, X } from "lucide-react";
import { GLOSSARY_ITEMS } from "./theoryData";
import { cn } from "@/lib/utils";

interface ContextualFABProps {
  onRestartTutorial: () => void;
  onOpenSearch: () => void;
}

export const ContextualFAB = ({ onRestartTutorial, onOpenSearch }: ContextualFABProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<"none" | "shortcuts" | "glossary">("none");

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {isOpen && (
          <div className="absolute bottom-16 right-0 mb-2 w-56 p-2 rounded-2xl bg-card border border-white/20 shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
            <button
              onClick={() => {
                setIsOpen(false);
                onRestartTutorial();
              }}
              className="w-full px-3 py-2 rounded-xl hover:bg-white/10 text-xs font-medium text-foreground flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-primary" />
              <span>Restart Interactive Tour</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                setActiveModal("shortcuts");
              }}
              className="w-full px-3 py-2 rounded-xl hover:bg-white/10 text-xs font-medium text-foreground flex items-center gap-2 transition-colors"
            >
              <Keyboard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Keyboard Shortcuts</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                setActiveModal("glossary");
              }}
              className="w-full px-3 py-2 rounded-xl hover:bg-white/10 text-xs font-medium text-foreground flex items-center gap-2 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Music Theory Glossary</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSearch();
              }}
              className="w-full px-3 py-2 rounded-xl hover:bg-white/10 text-xs font-medium text-foreground flex items-center gap-2 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Smart Theory Search</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 border backdrop-blur-md",
            isOpen
              ? "bg-white text-black border-white scale-110"
              : "bg-card/90 text-primary border-primary/40 hover:scale-105 hover:bg-card"
          )}
          title="Need Help / Shortcuts"
        >
          {isOpen ? <X className="w-5 h-5" /> : <HelpCircle className="w-6 h-6 animate-pulse" />}
        </button>
      </div>

      {/* Shortcuts Modal */}
      {activeModal === "shortcuts" && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-md w-full p-6 rounded-3xl bg-card border border-white/20 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-primary" />
                Keyboard Shortcuts
              </h3>
              <button onClick={() => setActiveModal("none")} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <span className="text-muted-foreground">Previous / Next Key</span>
                <span className="font-mono text-primary font-bold bg-white/10 px-2 py-0.5 rounded">← / →</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <span className="text-muted-foreground">Play Scale Audio</span>
                <span className="font-mono text-primary font-bold bg-white/10 px-2 py-0.5 rounded">Space</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <span className="text-muted-foreground">Toggle Guided Tour</span>
                <span className="font-mono text-primary font-bold bg-white/10 px-2 py-0.5 rounded">T</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <span className="text-muted-foreground">Toggle Minor Keys</span>
                <span className="font-mono text-primary font-bold bg-white/10 px-2 py-0.5 rounded">M</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <span className="text-muted-foreground">Open Smart Search</span>
                <span className="font-mono text-primary font-bold bg-white/10 px-2 py-0.5 rounded">Ctrl + K</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Glossary Modal */}
      {activeModal === "glossary" && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="max-w-lg w-full p-6 rounded-3xl bg-card border border-white/20 shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                Music Theory Glossary
              </h3>
              <button onClick={() => setActiveModal("none")} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-2">
              {GLOSSARY_ITEMS.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-white/5 space-y-1">
                  <div className="text-xs font-bold text-primary">{item.term}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
