import posthog from "posthog-js";

posthog.init(
    import.meta.env.VITE_POSTHOG_KEY,
    {
        api_host: "https://us.i.posthog.com",
        ui_host: "https://us.posthog.com",
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: false, // Turn off heavy click/mouse autocapture to save requests
        session_recording: false // Disable session recording to stop continuous event streaming
    }
);

export default posthog;
