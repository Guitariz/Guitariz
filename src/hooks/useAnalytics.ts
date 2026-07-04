import { useCallback } from 'react';
import { trackEvent, trackChordSearched, trackMetronomeStarted, trackScaleSelected, trackAnalysisCompleted, trackStemSplitCompleted } from '../analytics/events';
import posthog from '../analytics/posthog';

export function useAnalytics() {
  const identifyUser = useCallback((id: string, email?: string, username?: string) => {
    posthog.identify(id, { email, username });
  }, []);

  const resetUser = useCallback(() => {
    posthog.reset();
  }, []);

  const isFeatureEnabled = useCallback((featureFlag: string) => {
    return posthog.isFeatureEnabled(featureFlag);
  }, []);

  return {
    trackEvent,
    trackChordSearched,
    trackMetronomeStarted,
    trackScaleSelected,
    trackAnalysisCompleted,
    trackStemSplitCompleted,
    identifyUser,
    resetUser,
    isFeatureEnabled
  };
}
