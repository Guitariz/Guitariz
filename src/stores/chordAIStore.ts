import { create } from 'zustand';

export type AnalysisMode = 'fast' | 'balanced' | 'precise';

interface ChordAIState {
    showSimple: boolean;
    separateVocals: boolean;
    analysisMode: AnalysisMode;
    liveChordEnabled: boolean;

    setShowSimple: (show: boolean) => void;
    setSeparateVocals: (separate: boolean) => void;
    setAnalysisMode: (mode: AnalysisMode) => void;
    setLiveChordEnabled: (enabled: boolean) => void;
}

export const useChordAIStore = create<ChordAIState>((set) => ({
    showSimple: true,
    separateVocals: false,
    analysisMode: 'balanced', // default to balanced
    liveChordEnabled: false,

    setShowSimple: (showSimple) => set({ showSimple }),
    setSeparateVocals: (separateVocals) => set({ separateVocals }),
    setAnalysisMode: (analysisMode) => set({ analysisMode }),
    setLiveChordEnabled: (liveChordEnabled) => set({ liveChordEnabled }),
}));
