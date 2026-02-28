import { create } from 'zustand';
import { JamInstrument } from '@/lib/jamAudio';
import { chordLibraryData } from '@/data/chordData';

export interface ChordSlot {
    root: string;
    variant: string; // e.g. "Major", "Minor", "7", "m7"
    frets: number[];
    fingers: string[];
    label: string; // display label like "Am7"
}

export interface PresetProgression {
    name: string;
    genre: string;
    description: string;
    slots: { root: string; variant: string }[];
    color: string;
}

const VARIANT_LABELS: Record<string, string> = {
    Major: "", Minor: "m", "7": "7", maj7: "maj7", m7: "m7",
    sus4: "sus4", sus2: "sus2", add9: "add9", dim: "dim", aug: "aug", "6": "6", m6: "m6",
};

export function lookupChord(root: string, variant: string) {
    const rootData = chordLibraryData.roots.find((r) => r.root === root);
    if (!rootData) return null;
    const v = rootData.variants.find((vr) => vr.name === variant);
    if (!v || !v.voicings[0]) return null;
    return { frets: v.voicings[0].frets, fingers: v.voicings[0].fingers };
}

export function getChordLabel(root: string, variant: string): string {
    const abbrev = VARIANT_LABELS[variant] ?? variant.toLowerCase();
    return `${root}${abbrev}`;
}

const emptySlot = (): ChordSlot => ({
    root: "", variant: "", frets: [], fingers: [], label: "",
});

const SLOT_COUNT = 4;

interface JamState {
    slots: ChordSlot[];
    bpm: number;
    beatsPerChord: number;
    isPlaying: boolean;
    currentSlotIndex: number;
    currentBeat: number;
    instrument: JamInstrument;
    volume: number;
    editingSlot: number | null;
    showPresets: boolean;
    metronomeEnabled: boolean;

    // Actions
    setSlots: (slots: ChordSlot[]) => void;
    setBpm: (bpm: number) => void;
    setBeatsPerChord: (beats: number) => void;
    setIsPlaying: (isPlaying: boolean) => void;
    setCurrentSlotIndex: (index: number) => void;
    setCurrentBeat: (beat: number) => void;
    setInstrument: (instrument: JamInstrument) => void;
    setVolume: (volume: number) => void;
    setEditingSlot: (slot: number | null) => void;
    setShowPresets: (show: boolean) => void;
    setMetronomeEnabled: (enabled: boolean) => void;

    // Derived logic Actions
    setChordInSlot: (index: number, root: string, variant: string) => void;
    clearSlot: (index: number) => void;
    loadPreset: (preset: PresetProgression) => void;
    clearAll: () => void;
    stopPlayback: () => void;
}

export const useJamStore = create<JamState>((set, get) => ({
    slots: Array.from({ length: SLOT_COUNT }, emptySlot),
    bpm: 100,
    beatsPerChord: 4,
    isPlaying: false,
    currentSlotIndex: 0,
    currentBeat: 0,
    instrument: "piano",
    volume: 0.45,
    editingSlot: null,
    showPresets: true,
    metronomeEnabled: true,

    setSlots: (slots) => set({ slots }),
    setBpm: (bpm) => set({ bpm }),
    setBeatsPerChord: (beatsPerChord) => set({ beatsPerChord }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setCurrentSlotIndex: (currentSlotIndex) => set({ currentSlotIndex }),
    setCurrentBeat: (currentBeat) => set({ currentBeat }),
    setInstrument: (instrument) => set({ instrument }),
    setVolume: (volume) => set({ volume }),
    setEditingSlot: (editingSlot) => set({ editingSlot }),
    setShowPresets: (showPresets) => set({ showPresets }),
    setMetronomeEnabled: (metronomeEnabled) => set({ metronomeEnabled }),

    setChordInSlot: (index, root, variant) => {
        const chord = lookupChord(root, variant);
        set((state) => {
            const next = [...state.slots];
            next[index] = {
                root,
                variant,
                frets: chord?.frets ?? [],
                fingers: chord?.fingers ?? [],
                label: getChordLabel(root, variant),
            };
            return { slots: next, editingSlot: null };
        });
    },

    clearSlot: (index) => {
        set((state) => {
            const next = [...state.slots];
            next[index] = emptySlot();
            return { slots: next };
        });
    },

    loadPreset: (preset) => {
        get().stopPlayback();
        const newSlots: ChordSlot[] = preset.slots.map((s) => {
            const chord = lookupChord(s.root, s.variant);
            return {
                root: s.root,
                variant: s.variant,
                frets: chord?.frets ?? [],
                fingers: chord?.fingers ?? [],
                label: getChordLabel(s.root, s.variant),
            };
        });
        while (newSlots.length < SLOT_COUNT) newSlots.push(emptySlot());
        set({ slots: newSlots, showPresets: false });
    },

    clearAll: () => {
        get().stopPlayback();
        set({ slots: Array.from({ length: SLOT_COUNT }, emptySlot) });
    },

    stopPlayback: () => {
        set({ isPlaying: false, currentBeat: 0, currentSlotIndex: 0 });
    }
}));
