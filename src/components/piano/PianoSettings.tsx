/**
 * Piano keyboard settings panel
 * Clean, uncluttered layout and keymapping reference
 */

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Keyboard, Piano, SlidersHorizontal } from 'lucide-react';
import { KeyboardPreset } from '@/types/pianoTypes';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

interface PianoSettingsProps {
  keyboardPreset: KeyboardPreset;
  onKeyboardPresetChange: (preset: KeyboardPreset) => void;
  showKeymapHints: boolean;
  onToggleKeymapHints: (val: boolean) => void;
  onClear: () => void;
}

export const PianoSettings = ({
  keyboardPreset,
  onKeyboardPresetChange,
  showKeymapHints,
  onToggleKeymapHints,
  onClear,
}: PianoSettingsProps) => {
  return (
    <div className="space-y-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Piano className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white tracking-tight">Piano Controls</h3>
              <p className="text-xs text-muted-foreground">Customize computer keyboard mapping & visuals</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="h-8 gap-2 rounded-lg border-white/10 bg-white/5 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="font-bold">Clear Notes</span>
          </Button>
        </div>

        <div className="space-y-4">
          {/* Keyboard Layout Selector */}
          <div className="space-y-2">
            <Label htmlFor="keyboard-preset" className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Keyboard className="w-3.5 h-3.5" />
              Keyboard Layout
            </Label>
            <Select
              value={keyboardPreset}
              onValueChange={(value) => onKeyboardPresetChange(value as KeyboardPreset)}
            >
              <SelectTrigger id="keyboard-preset" className="bg-white/5 border-white/10 hover:border-white/20 h-10 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qwerty" className="text-xs">QWERTY (Standard)</SelectItem>
                <SelectItem value="azerty" className="text-xs">AZERTY</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Toggle Keymap Shortcuts on Keys */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div>
              <p className="text-sm font-medium text-white">Show Keymap Hints on Keys</p>
              <p className="text-xs text-muted-foreground">Display computer keys (A, W, S, D...) on the piano</p>
            </div>
            <Switch checked={showKeymapHints} onCheckedChange={onToggleKeymapHints} />
          </div>
        </div>
      </div>

      {/* Clean Compact Reference Guide */}
      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2.5">
        <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
          <span>Quick Key Reference</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
            <span className="text-muted-foreground text-[11px]">White Keys:</span>
            <span className="font-mono font-bold text-white text-[10px] bg-white/10 px-1.5 py-0.5 rounded">
              {keyboardPreset === 'azerty' ? 'Q S D F G H J K' : 'A S D F G H J K'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
            <span className="text-muted-foreground text-[11px]">Black Keys:</span>
            <span className="font-mono font-bold text-white text-[10px] bg-white/10 px-1.5 py-0.5 rounded">
              {keyboardPreset === 'azerty' ? 'Z E T Y U O P' : 'W E T Y U O P'}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
            <span className="text-muted-foreground text-[11px]">Octave Down / Up:</span>
            <span className="font-mono font-bold text-primary text-[10px] bg-primary/10 px-1.5 py-0.5 rounded">
              Z / X
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
            <span className="text-muted-foreground text-[11px]">Sustain Pedal:</span>
            <span className="font-mono font-bold text-amber-300 text-[10px] bg-amber-400/10 px-1.5 py-0.5 rounded">
              Spacebar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
