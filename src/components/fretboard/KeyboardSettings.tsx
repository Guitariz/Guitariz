/**
 * Settings UI for configuring keyboard mappings
 */

import { useState } from 'react';
import { KeymapConfig, DEFAULT_KEYMAP } from '@/types/keyboardTypes';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings2, Download, Upload, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface KeyboardSettingsProps {
  keymap: KeymapConfig;
  strumSpeed: number;
  velocityProfile: 'linear' | 'exponential' | 'uniform';
  chordMode: boolean;
  onKeymapChange: (keymap: KeymapConfig) => void;
  onStrumSpeedChange: (speed: number) => void;
  onVelocityProfileChange: (profile: 'linear' | 'exponential' | 'uniform') => void;
  onChordModeChange: (enabled: boolean) => void;
}

export const KeyboardSettings = ({
  keymap,
  strumSpeed,
  velocityProfile,
  chordMode,
  onKeymapChange,
  onStrumSpeedChange,
  onVelocityProfileChange,
  onChordModeChange,
}: KeyboardSettingsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExport = () => {
    const data = JSON.stringify({ keymap, strumSpeed, velocityProfile, chordMode }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'keyboard-config.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Configuration exported');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.keymap) onKeymapChange(data.keymap);
        if (data.strumSpeed) onStrumSpeedChange(data.strumSpeed);
        if (data.velocityProfile) onVelocityProfileChange(data.velocityProfile);
        if (data.chordMode !== undefined) onChordModeChange(data.chordMode);
        toast.success('Configuration imported');
      } catch (error) {
        toast.error('Invalid configuration file');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    onKeymapChange(DEFAULT_KEYMAP);
    onStrumSpeedChange(30);
    onVelocityProfileChange('exponential');
    onChordModeChange(false);
    toast.success('Reset to defaults');
  };

  return (
    <Card className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Keyboard Settings</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-6 animate-accordion-down">
          {/* Chord Mode */}
          <div className="flex items-center justify-between">
            <Label htmlFor="chord-mode" className="text-sm">
              Chord Mode (strum on Enter)
            </Label>
            <Switch
              id="chord-mode"
              checked={chordMode}
              onCheckedChange={onChordModeChange}
            />
          </div>

          {/* Strum Speed */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="strum-speed" className="text-sm">
                Strum Speed
              </Label>
              <span className="text-sm text-muted-foreground">{strumSpeed}ms</span>
            </div>
            <Slider
              id="strum-speed"
              min={10}
              max={100}
              step={5}
              value={[strumSpeed]}
              onValueChange={([value]) => onStrumSpeedChange(value)}
            />
          </div>

          {/* Velocity Profile */}
          <div className="space-y-2">
            <Label htmlFor="velocity-profile" className="text-sm">
              Velocity Profile
            </Label>
            <Select value={velocityProfile} onValueChange={onVelocityProfileChange}>
              <SelectTrigger id="velocity-profile">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uniform">Uniform</SelectItem>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="exponential">Exponential</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Import/Export/Reset */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-border/50">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" asChild>
              <label>
                <Upload className="w-4 h-4 mr-2" />
                Import
                <Input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
