import { Suspense, lazy, useEffect } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Routes, Route, useLocation } from "react-router-dom";
import { GlobalMenu } from "@/components/GlobalMenu";
import { InstallPrompt } from "@/components/InstallPrompt";
import { MusicCursorTrail } from "@/components/MusicCursorTrail";
import Lenis from "lenis";

const Index = lazy(() => import("./pages/Index"));
const FretboardPage = lazy(() => import("./pages/FretboardPage"));
const ChordsPage = lazy(() => import("./pages/ChordsPage"));
const ScalesPage = lazy(() => import("./pages/ScalesPage"));
const MetronomePage = lazy(() => import("./pages/MetronomePage"));
const ChordAIPage = lazy(() => import("./pages/ChordAIPage"));
const VocalSplitterPage = lazy(() => import("./pages/VocalSplitterPage"));
const StemSeparatorPage = lazy(() => import("./pages/StemSeparatorPage"));
const TheoryPage = lazy(() => import("./pages/TheoryPage"));
const TunerPage = lazy(() => import("./pages/TunerPage"));
const EarTrainingPage = lazy(() => import("./pages/EarTrainingPage"));
const JamPage = lazy(() => import("./pages/JamPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

import GuitarizLoader from "@/components/ui/loader";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

const RouteFallback = () => (
  <GuitarizLoader fullScreen text="INITIALIZING" />
);

const queryClient = new QueryClient();

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3, ease: "linear" }}
  >
    {children}
  </motion.div>
);

const App = () => {
  const location = useLocation();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.0,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Analytics />
      <SpeedInsights />
      <TooltipProvider>
        {/* Skip to content for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[10000] px-3 py-2 rounded bg-white text-black shadow"
        >
          Skip to content
        </a>

        {/* Global Sliding Menu */}
        <GlobalMenu />

        {/* PWA Install Prompt */}
        <InstallPrompt />

        {/* Premium Deep Black Foundation */}
        <div className="fixed inset-0 z-[-1] bg-background" />

        <MusicCursorTrail />

        <Toaster />
        <Sonner />
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route
                path="/"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <PageWrapper>
                      <main id="main-content">
                        <Index />
                      </main>
                    </PageWrapper>
                  </Suspense>
                }
              />
              <Route
                path="/fretboard"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <PageWrapper>
                      <main id="main-content">
                        <FretboardPage />
                      </main>
                    </PageWrapper>
                  </Suspense>
                }
              />
              <Route
                path="/fretboard/:root/:variant/:voicingIndex?"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <PageWrapper>
                      <main id="main-content">
                        <FretboardPage />
                      </main>
                    </PageWrapper>
                  </Suspense>
                }
              />
              <Route
                path="/chords"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <PageWrapper>
                      <main id="main-content">
                        <ChordsPage />
                      </main>
                    </PageWrapper>
                  </Suspense>
                }
              />
              <Route
                path="/scales"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <PageWrapper>
                      <main id="main-content">
                        <ScalesPage />
                      </main>
                    </PageWrapper>
                  </Suspense>
                }
              />
              <Route
                path="/metronome"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <PageWrapper>
                      <main id="main-content">
                        <MetronomePage />
                      </main>
                    </PageWrapper>
                  </Suspense>
                }
              />
              <Route
                path="/chord-ai"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <PageWrapper>
                      <main id="main-content">
                        <ChordAIPage />
                      </main>
                    </PageWrapper>
                  </Suspense>
                }
              />
              <Route
                path="/vocal-splitter"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <PageWrapper>
                      <main id="main-content">
                        <VocalSplitterPage />
                      </main>
                    </PageWrapper>
                  </Suspense>
                }
              />
              <Route
                path="/stem-separator"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <PageWrapper>
                      <main id="main-content">
                        <StemSeparatorPage />
                      </main>
                    </PageWrapper>
                  </Suspense>
                }
              />
              <Route
                path="/theory"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <PageWrapper>
                      <main id="main-content">
                        <TheoryPage />
                      </main>
                    </PageWrapper>
                  </Suspense>
                }
              />
              <Route
                path="/tuner"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <PageWrapper>
                      <main id="main-content">
                        <TunerPage />
                      </main>
                    </PageWrapper>
                  </Suspense>
                }
              />
              <Route
                path="/ear-training"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <PageWrapper>
                      <main id="main-content">
                        <EarTrainingPage />
                      </main>
                    </PageWrapper>
                  </Suspense>
                }
              />
              <Route
                path="/jam"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <PageWrapper>
                      <main id="main-content">
                        <JamPage />
                      </main>
                    </PageWrapper>
                  </Suspense>
                }
              />
              <Route
                path="*"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <PageWrapper>
                      <main id="main-content">
                        <NotFound />
                      </main>
                    </PageWrapper>
                  </Suspense>
                }
              />
            </Routes>
          </AnimatePresence>
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
