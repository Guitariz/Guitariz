import posthog from "posthog-js";

posthog.init(
    import.meta.env.VITE_POSTHOG_KEY,
    {
        api_host: import.meta.env.VITE_POSTHOG_HOST,
        capture_pageview: false,
        capture_pageleave: true,
        autocapture: true,
        session_recording: {
            maskAllInputs: true
        }
    }
);

export default posthog;
