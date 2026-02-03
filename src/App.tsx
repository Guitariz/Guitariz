import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Routes, Route, useLocation } from "react-router-dom";
import { GlobalMenu } from "@/components/GlobalMenu";
import Lenis from "lenis";

const Index = lazy(() => import("./pages/Index"));
const FretboardPage = lazy(() => import("./pages/FretboardPage"));
const ChordsPage = lazy(() => import("./pages/ChordsPage"));
const ScalesPage = lazy(() => import("./pages/ScalesPage"));
const MetronomePage = lazy(() => import("./pages/MetronomePage"));
const ChordAIPage = lazy(() => import("./pages/ChordAIPage"));
const VocalSplitterPage = lazy(() => import("./pages/VocalSplitterPage"));
const TheoryPage = lazy(() => import("./pages/TheoryPage"));
const TunerPage = lazy(() => import("./pages/TunerPage"));
const EarTrainingPage = lazy(() => import("./pages/EarTrainingPage"));
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
        {/* Global Sliding Menu */}
        <GlobalMenu />

        {/* Premium Deep Black Foundation */}
        <div className="fixed inset-0 z-[-1] bg-[#020202]" />

        <Toaster />
        <Sonner />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <PageWrapper>
                    <Index />
                  </PageWrapper>
                </Suspense>
              }
            />
            <Route
              path="/fretboard"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <PageWrapper>
                    <FretboardPage />
                  </PageWrapper>
                </Suspense>
              }
            />
            <Route
              path="/fretboard/:root/:variant/:voicingIndex?"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <PageWrapper>
                    <FretboardPage />
                  </PageWrapper>
                </Suspense>
              }
            />
            <Route
              path="/chords"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <PageWrapper>
                    <ChordsPage />
                  </PageWrapper>
                </Suspense>
              }
            />
            <Route
              path="/scales"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <PageWrapper>
                    <ScalesPage />
                  </PageWrapper>
                </Suspense>
              }
            />
            <Route
              path="/metronome"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <PageWrapper>
                    <MetronomePage />
                  </PageWrapper>
                </Suspense>
              }
            />
            <Route
              path="/chord-ai"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <PageWrapper>
                    <ChordAIPage />
                  </PageWrapper>
                </Suspense>
              }
            />
            <Route
              path="/vocal-splitter"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <PageWrapper>
                    <VocalSplitterPage />
                  </PageWrapper>
                </Suspense>
              }
            />
            <Route
              path="/theory"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <PageWrapper>
                    <TheoryPage />
                  </PageWrapper>
                </Suspense>
              }
            />
            <Route
              path="/tuner"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <PageWrapper>
                    <TunerPage />
                  </PageWrapper>
                </Suspense>
              }
            />
            <Route
              path="/ear-training"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <PageWrapper>
                    <EarTrainingPage />
                  </PageWrapper>
                </Suspense>
              }
            />
            <Route
              path="*"
              element={
                <Suspense fallback={<RouteFallback />}>
                  <PageWrapper>
                    <NotFound />
                  </PageWrapper>
                </Suspense>
              }
            />
          </Routes>
        </AnimatePresence>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
