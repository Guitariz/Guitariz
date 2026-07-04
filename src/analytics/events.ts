import posthog from "./posthog";

export const AnalyticsEvents = {
  // Navigation
  PAGE_VIEW: "page_view",
  HERO_CTA_CLICKED: "hero_cta_clicked",
  FEATURE_OPENED: "feature_opened",

  // Chords
  CHORD_SEARCHED: "chord_searched",
  CHORD_VIEWED: "chord_viewed",
  FAVORITE_CHORD: "favorite_chord",

  // Scales
  SCALE_SELECTED: "scale_selected",
  SCALE_COMPARED: "scale_compared",
  MODE_CHANGED: "mode_changed",

  // Fretboard
  FRETBOARD_NOTE_CLICKED: "fretboard_note_clicked",
  FRETBOARD_PATTERN_LOADED: "fretboard_pattern_loaded",

  // Circle
  CIRCLE_NOTE_CLICKED: "circle_note_clicked",
  PROGRESSION_GENERATED: "progression_generated",

  // Metronome
  METRONOME_STARTED: "metronome_started",
  METRONOME_STOPPED: "metronome_stopped",
  BPM_CHANGED: "bpm_changed",

  // Audio
  SONG_UPLOADED: "song_uploaded",
  ANALYSIS_STARTED: "analysis_started",
  ANALYSIS_COMPLETED: "analysis_completed",
  ANALYSIS_FAILED: "analysis_failed",

  // AI
  STEM_SPLIT_STARTED: "stem_split_started",
  STEM_SPLIT_COMPLETED: "stem_split_completed",
  AI_FAILED: "ai_failed",

  // Lessons
  LESSON_STARTED: "lesson_started",
  LESSON_COMPLETED: "lesson_completed",
  QUIZ_FINISHED: "quiz_finished",

  // Downloads
  MIDI_DOWNLOADED: "midi_downloaded",
  PDF_DOWNLOADED: "pdf_downloaded",
  AUDIO_EXPORTED: "audio_exported",
} as const;

export const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  posthog.capture(eventName, properties);
};

// Helper functions for specific events
export const trackChordSearched = (chord: string, searchLength?: number) => {
  trackEvent(AnalyticsEvents.CHORD_SEARCHED, { chord, searchLength });
};

export const trackMetronomeStarted = (bpm: number, timeSignature: string) => {
  trackEvent(AnalyticsEvents.METRONOME_STARTED, { bpm, timeSignature });
};

export const trackScaleSelected = (tonic: string, mode: string) => {
  trackEvent(AnalyticsEvents.SCALE_SELECTED, { tonic, mode });
};

export const trackAnalysisCompleted = (duration: number, key: string) => {
  trackEvent(AnalyticsEvents.ANALYSIS_COMPLETED, { duration, key });
};

export const trackStemSplitCompleted = (processingTime: number) => {
  trackEvent(AnalyticsEvents.STEM_SPLIT_COMPLETED, { processingTime });
};
