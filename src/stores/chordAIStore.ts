import { create } from 'zustand';

interface ChordAIState {
    showSimple: boolean;
    separateVocals: boolean;
    useMadmom: boolean;
    liveChordEnabled: boolean;

    setShowSimple: (show: boolean) => void;
    setSeparateVocals: (separate: boolean) => void;
    setUseMadmom: (use: boolean) => void;
    setLiveChordEnabled: (enabled: boolean) => void;
}

export const useChordAIStore = create<ChordAIState>((set) => ({
    showSimple: false,
    separateVocals: false,
    useMadmom: true,
    liveChordEnabled: false,

    setShowSimple: (showSimple) => set({ showSimple }),
    setSeparateVocals: (separateVocals) => set({ separateVocals }),
    setUseMadmom: (useMadmom) => set({ useMadmom }),
    setLiveChordEnabled: (liveChordEnabled) => set({ liveChordEnabled }),
}));
