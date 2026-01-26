import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";

const Index = lazy(() => import("./pages/Index"));
const FretboardPage = lazy(() => import("./pages/FretboardPage"));
const ChordsPage = lazy(() => import("./pages/ChordsPage"));
const ScalesPage = lazy(() => import("./pages/ScalesPage"));
const MetronomePage = lazy(() => import("./pages/MetronomePage"));
const ChordAIPage = lazy(() => import("./pages/ChordAIPage"));
const VocalSplitterPage = lazy(() => import("./pages/VocalSplitterPage"));
const TheoryPage = lazy(() => import("./pages/TheoryPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

import GuitarizLoader from "@/components/ui/loader";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

const RouteFallback = () => (
  <GuitarizLoader fullScreen text="INITIALIZING" />
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Analytics />
    <SpeedInsights />
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<RouteFallback />}>
              <Index />
            </Suspense>
          }
        />
        <Route
          path="/fretboard"
          element={
            <Suspense fallback={<RouteFallback />}>
              <FretboardPage />
            </Suspense>
          }
        />
        <Route
          path="/chords"
          element={
            <Suspense fallback={<RouteFallback />}>
              <ChordsPage />
            </Suspense>
          }
        />
        <Route
          path="/scales"
          element={
            <Suspense fallback={<RouteFallback />}>
              <ScalesPage />
            </Suspense>
          }
        />
        <Route
          path="/metronome"
          element={
            <Suspense fallback={<RouteFallback />}>
              <MetronomePage />
            </Suspense>
          }
        />
        <Route
          path="/chord-ai"
          element={
            <Suspense fallback={<RouteFallback />}>
              <ChordAIPage />
            </Suspense>
          }
        />
        <Route
          path="/vocal-splitter"
          element={
            <Suspense fallback={<RouteFallback />}>
              <VocalSplitterPage />
            </Suspense>
          }
        />
        <Route
          path="/theory"
          element={
            <Suspense fallback={<RouteFallback />}>
              <TheoryPage />
            </Suspense>
          }
        />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route
          path="*"
          element={
            <Suspense fallback={<RouteFallback />}>
              <NotFound />
            </Suspense>
          }
        />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
