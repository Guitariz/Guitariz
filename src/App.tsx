import { Suspense, lazy, useEffect, useState } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Routes, Route, useLocation } from "react-router-dom";
import { GlobalMenu } from "@/components/GlobalMenu";
import { InstallPrompt } from "@/components/InstallPrompt";
import { FeedbackModal } from "@/components/FeedbackModal";
import Lenis from "lenis";
import PostHogPageView from "@/analytics/PageView";
import GAPageView from "@/analytics/GAPageView";


const Index = lazy(() => import("./pages/Index"));
const FretboardPage = lazy(() => import("./pages/FretboardPage"));
const ChordsPage = lazy(() => import("./pages/ChordsPage"));
const ScalesPage = lazy(() => import("./pages/ScalesPage"));
const MetronomePage = lazy(() => import("./pages/MetronomePage"));
const ChordAIPage = lazy(() => import("./pages/ChordAIPage"));
const VocalSplitterPage = lazy(() => import("./pages/VocalSplitterPage"));
const StemSeparatorPage = lazy(() => import("./pages/StemSeparatorPage"));
const TheoryPage = lazy(() => import("./pages/TheoryPage"));
const RagaTheoryPage = lazy(() => import("./pages/RagaTheoryPage"));
const TunerPage = lazy(() => import("./pages/TunerPage"));
const EarTrainingPage = lazy(() => import("./pages/EarTrainingPage"));
const JamPage = lazy(() => import("./pages/JamPage"));
const BlogListPage = lazy(() => import("./pages/BlogListPage"));
const BlogPostPage = lazy(() => import("./pages/BlogPostPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const GearPage = lazy(() => import("./pages/GearPage"));
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

const ProductHuntBanner = () => {
  const [isVisible, setIsVisible] = useState(() => {
    return !localStorage.getItem("dismissed-ph-banner");
  });

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("dismissed-ph-banner", "true");
  };

  return (
    <div className="w-full bg-[#0a0a0a] border-b border-white/[0.06] text-zinc-300 text-xs py-2.5 pl-4 pr-16 text-center z-[80] relative flex items-center justify-center gap-4">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 font-medium">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#da552f] animate-ping shrink-0" style={{ animationDuration: '2s' }} />
          <span>We are live on Product Hunt! Support Guitariz Studio and share your feedback.</span>
        </span>
        <div className="flex items-center gap-3 shrink-0">
          <a 
            href="https://www.producthunt.com/products/guitariz-studio?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-guitariz-studio" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#da552f] hover:underline font-bold transition-all inline-flex items-center gap-1"
          >
            View Launch Page ➔
          </a>
          <span className="text-zinc-700">|</span>
          <button 
            onClick={handleDismiss}
            className="text-zinc-500 hover:text-zinc-300 transition-colors px-1 text-[10px] uppercase font-bold tracking-wider"
            aria-label="Dismiss banner"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

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
        <ProductHuntBanner />
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

        {/* Floating Feedback Widget */}
        <FeedbackModal />

        {/* Premium Deep Black Foundation */}
        <div className="fixed inset-0 z-[-1] bg-[#020202]" />

        <Toaster />
        <Sonner />
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <PostHogPageView />
            <GAPageView />
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
                path="/raga-theory"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <PageWrapper>
                      <main id="main-content">
                        <RagaTheoryPage />
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
                path="/blog"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <PageWrapper>
                      <main id="main-content">
                        <BlogListPage />
                      </main>
                    </PageWrapper>
                  </Suspense>
                }
              />
              <Route
                path="/blog/:slug"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <PageWrapper>
                      <main id="main-content">
                        <BlogPostPage />
                      </main>
                    </PageWrapper>
                  </Suspense>
                }
              />
              <Route
                path="/privacy"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <PageWrapper>
                      <main id="main-content">
                        <PrivacyPolicyPage />
                      </main>
                    </PageWrapper>
                  </Suspense>
                }
              />
              <Route
                path="/terms"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <PageWrapper>
                      <main id="main-content">
                        <TermsOfServicePage />
                      </main>
                    </PageWrapper>
                  </Suspense>
                }
              />
              <Route
                path="/gear"
                element={
                  <Suspense fallback={<RouteFallback />}>
                    <PageWrapper>
                      <main id="main-content">
                        <GearPage />
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
