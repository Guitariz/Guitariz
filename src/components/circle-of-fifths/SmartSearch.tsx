import { useState, useMemo } from "react";
import { CIRCLE_KEYS } from "./theoryData";
import { Search, X, Music, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectKey: (note: string) => void;
}

export const SmartSearch = ({ isOpen, onClose, onSelectKey }: SmartSearchProps) => {
  const [query, setQuery] = useState("");

  const filteredKeys = useMemo(() => {
    if (!query.trim()) return CIRCLE_KEYS;
    const q = query.toLowerCase().trim();
    return CIRCLE_KEYS.filter(
      (k) =>
        k.note.toLowerCase().includes(q) ||
        k.relativeMinor.toLowerCase().includes(q) ||
        k.summary.toLowerCase().includes(q) ||
        k.diatonicChords.some((c) => c.toLowerCase().includes(q)) ||
        `${k.sharps} sharp`.includes(q) ||
        `${k.flats} flat`.includes(q)
    );
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-in fade-in duration-200">
      <div className="max-w-xl w-full rounded-2xl bg-card border border-white/20 shadow-2xl overflow-hidden flex flex-col">
        {/* Search Header */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-primary shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search "G Major", "Am", "2 Sharps", "Mixolydian", "I-V-vi-IV"...'
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="text-xs bg-white/10 px-2 py-1 rounded text-muted-foreground hover:text-foreground">
            Esc
          </button>
        </div>

        {/* Search Results */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredKeys.length > 0 ? (
            filteredKeys.map((k) => (
              <button
                key={k.note}
                onClick={() => {
                  onSelectKey(k.note);
                  onClose();
                }}
                className="w-full p-3 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center font-bold text-primary group-hover:scale-105 transition-transform">
                    {k.note}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <span>{k.note} Major</span>
                      <span className="text-xs text-muted-foreground">({k.relativeMinor})</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground leading-tight">
                      {k.sharps > 0 ? `${k.sharps} Sharps` : k.flats > 0 ? `${k.flats} Flats` : "0 Accidentals"} • {k.summary}
                    </div>
                  </div>
                </div>

                <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Jump →
                </span>
              </button>
            ))
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No matching keys or theory items found for "{query}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
