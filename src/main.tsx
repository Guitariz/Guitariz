import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./App.css";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./analytics/posthog";
import "./analytics/ga4";

import { toast } from "sonner";

// Handle dynamic import errors (like missing chunks due to new deployments)
window.addEventListener('vite:preloadError', () => {
    window.location.reload();
});

// Register service worker for PWA
const updateSW = registerSW({ 
    onNeedRefresh() {
        toast.message("Update Available 🚀", {
            description: "A new version of Guitariz is ready.",
            action: {
                label: "Update Now",
                onClick: () => updateSW(true)
            },
            duration: Infinity,
        });
    },
});
createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <ThemeProvider>
            <App />
        </ThemeProvider>
    </BrowserRouter>
);