/**
 * Keyboard help overlay showing key bindings
 * Features backdrop click-to-close, Escape key handler, and responsive scrolling
 */

import { useEffect } from 'react';
import { KeymapConfig } from '@/types/keyboardTypes';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Keyboard, Sparkles, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface KeyboardHelpOverlayProps {
  keymap: KeymapConfig;
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardHelpOverlay = ({ keymap, isOpen, onClose }: KeyboardHelpOverlayProps) => {
  // Listen for Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl bg-[#121014] border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Sticky Header */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-white/10 bg-black/40 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Keyboard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Instrument & Keyboard Guide</h2>
                  <p className="text-xs text-muted-foreground">Interactive shortcuts and playing controls</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-muted-foreground bg-white/5 border border-white/10 rounded">
                  ESC
                </kbd>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={onClose}
                  className="h-8 w-8 text-muted-foreground hover:text-white rounded-lg hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-4 md:p-6 overflow-y-auto space-y-6 custom-scrollbar text-sm">
              {/* How to play card */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/15 space-y-2.5">
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> How to Play
                </h3>
                <ul className="text-xs space-y-2 text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">●</span>
                    <span><strong className="text-white">Fretboard Notes:</strong> Click any string fret to toggle a note. Real guitar voicings automatically detect chords in real-time.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">●</span>
                    <span><strong className="text-white">Strum / Play:</strong> Click <strong className="text-white">"Strum Chord"</strong> or press <strong className="text-primary font-mono font-bold">ENTER</strong> to strum all active strings.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">●</span>
                    <span><strong className="text-white">Virtual Piano:</strong> Switch to Piano view to play via your computer keyboard (<strong className="text-white">A, S, D, F...</strong> for white keys, <strong className="text-white">W, E, T, Y...</strong> for black keys).</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">●</span>
                    <span><strong className="text-white">Scale Overlays:</strong> Choose any key & scale mode to highlight all target intervals (Roots, 3rds, 5ths) across both neck and piano.</span>
                  </li>
                </ul>
              </div>

              {/* Guitar neck keyboard mappings */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Guitar Neck Hotkeys (A - L)
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {keymap.notes.map((mapping) => (
                    <div 
                      key={mapping.key} 
                      className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/5"
                    >
                      <Badge variant="outline" className="font-mono uppercase bg-black/40 border-white/10 text-xs text-primary">
                        {mapping.key}
                      </Badge>
                      <span className="text-xs font-bold text-white font-mono">{mapping.note}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strum & Octave Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Strum Chord</span>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-xs bg-black/40 text-primary">
                      {keymap.downStrum}
                    </Badge>
                    <span className="text-xs text-white/80">Strum selected notes</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Octave Shift</span>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1 font-mono text-xs text-primary">
                      <Badge variant="outline" className="bg-black/40">{keymap.octaveDown}</Badge>
                      <Badge variant="outline" className="bg-black/40">{keymap.octaveUp}</Badge>
                    </div>
                    <span className="text-xs text-white/80">Down / Up (±12)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="p-3.5 md:p-4 border-t border-white/10 bg-black/40 flex justify-end shrink-0">
              <Button 
                onClick={onClose} 
                className="gap-1.5 text-xs font-bold h-8 px-4 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Check className="w-3.5 h-3.5" /> Got it
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default KeyboardHelpOverlay;
