import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import posthog from "./posthog";

export default function PostHogPageView() {
    const location = useLocation();

    useEffect(() => {
        posthog.capture("$pageview");
    }, [location]);

    return null;
}
