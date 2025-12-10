/**
 * Piano keyboard settings button with modal
 * Configure keyboard layout, octave range, and preferences
 */

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, Piano, Keyboard } from 'lucide-react';
import { KeyboardPreset } from '@/types/pianoTypes';
import { useState } from 'react';

interface PianoSettingsProps {
  keyboardPreset: KeyboardPreset;
  onKeyboardPresetChange: (preset: KeyboardPreset) => void;
  sustained: boolean;
  octaveShift: number;
}

export const PianoSettings = ({
  keyboardPreset,
  onKeyboardPresetChange,
  sustained,
  octaveShift,
}: PianoSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="btn-professional glass-card hover-lift focus-professional gap-2 border-primary/30 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300"
        >
          <Settings className="w-4 h-4" />
          Piano Settings
          {(sustained || octaveShift !== 0) && (
            <Badge variant="secondary" className="text-xs ml-1 px-1.5 py-0.5">
              {sustained ? 'S' : ''}{octaveShift !== 0 ? `${octaveShift > 0 ? '+' : ''}${octaveShift}O` : ''}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="glass-card border-primary/30 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-gradient">
            <div className="p-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg">
              <Piano className="w-5 h-5 text-primary" />
            </div>
            Piano Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Keyboard Layout Preset */}
          <div className="space-y-3">
            <Label htmlFor="keyboard-preset" className="text-sm font-medium flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-primary" />
              Keyboard Layout
            </Label>
            <Select
              value={keyboardPreset}
              onValueChange={(value) => onKeyboardPresetChange(value as KeyboardPreset)}
            >
              <SelectTrigger id="keyboard-preset" className="glass-card border-primary/20 hover:border-primary/40 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qwerty">QWERTY</SelectItem>
                <SelectItem value="azerty">AZERTY</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose keyboard layout for key mapping
            </p>
          </div>

          {/* Key bindings info */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-muted/20 to-muted/10 border border-primary/10">
            <div className="font-medium mb-3 text-sm flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-primary" />
              Key Bindings
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>White keys:</span>
                <span className="font-mono">A S D F G H J K</span>
              </div>
              <div className="flex justify-between">
                <span>Black keys:</span>
                <span className="font-mono">W E T Y U</span>
              </div>
              <div className="flex justify-between">
                <span>Octave down:</span>
                <span className="font-mono">Z</span>
              </div>
              <div className="flex justify-between">
                <span>Octave up:</span>
                <span className="font-mono">X</span>
              </div>
              <div className="flex justify-between">
                <span>Sustain toggle:</span>
                <span className="font-mono">Space</span>
              </div>
            </div>
          </div>

          {/* Status indicators */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Current Status</Label>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={sustained ? "default" : "outline"}
                className={`text-xs transition-all duration-300 ${
                  sustained ? 'bg-gradient-accent text-primary-foreground animate-bounce-gentle' : 'border-primary/30'
                }`}
              >
                Sustain: {sustained ? 'ON' : 'OFF'}
              </Badge>
              <Badge
                variant={octaveShift !== 0 ? "default" : "outline"}
                className={`text-xs font-mono transition-all duration-300 ${
                  octaveShift !== 0 ? 'bg-gradient-ocean text-primary-foreground animate-bounce-gentle' : 'border-primary/30'
                }`}
              >
                Octave: {octaveShift > 0 ? '+' : ''}{octaveShift}
              </Badge>
            </div>
          </div>

          {/* Quick tips */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-accent/5 to-primary/5 border border-accent/20">
            <p className="text-xs text-muted-foreground leading-relaxed">
              💡 <strong>Tip:</strong> Use octave shift to access different ranges of the piano keyboard.
              Sustain mode keeps notes playing until released.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
