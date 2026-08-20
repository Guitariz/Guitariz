import { useMemo, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { chordLibraryData } from "@/data/chordData";
import { slugToRoot, slugToVariant, getChordUrl, formatChordDisplayName, formatChordFullName } from "@/utils/chordSlug";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import ChordDiagram from "@/components/chord/ChordDiagram";
import { playChord } from "@/lib/chordAudio";
import { SEOContent, Breadcrumb } from "@/components/SEOContent";
import RelatedTools from "@/components/RelatedTools";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Volume2, Guitar, Layers, BookOpen, Music2, ArrowRight, ArrowLeft } from "lucide-react";

const ChordDetailPage = () => {
  const { root: rawRoot, variant: rawVariant } = useParams<{ root?: string; variant?: string }>();
  const navigate = useNavigate();

  // Resolve root & variant from slug or raw param
  const { resolvedRoot, resolvedVariant, rootData, variantData } = useMemo(() => {
    if (!rawRoot || !rawVariant) {
      return { resolvedRoot: null, resolvedVariant: null, rootData: null, variantData: null };
    }

    const matchedRootStr = slugToRoot(rawRoot) || rawRoot;
    const matchedVariantStr = slugToVariant(rawVariant) || rawVariant;

    const rData = chordLibraryData.roots.find(
      (r) =>
        r.root.toLowerCase() === matchedRootStr.toLowerCase() ||
        r.root.split("/").some((part) => part.toLowerCase() === matchedRootStr.toLowerCase())
    );

    const vData = rData?.variants.find(
      (v) => v.name.toLowerCase() === matchedVariantStr.toLowerCase()
    );

    return {
      resolvedRoot: rData?.root || matchedRootStr,
      resolvedVariant: vData?.name || matchedVariantStr,
      rootData: rData || null,
      variantData: vData || null,
    };
  }, [rawRoot, rawVariant]);

  const [activeVoicingIndex, setActiveVoicingIndex] = useState(0);

  const chordFullName = useMemo(() => {
    if (!resolvedRoot || !resolvedVariant) return "Chord Details";
    return formatChordFullName(resolvedRoot, resolvedVariant);
  }, [resolvedRoot, resolvedVariant]);

  const chordDisplayName = useMemo(() => {
    if (!resolvedRoot || !resolvedVariant) return "";
    return formatChordDisplayName(resolvedRoot, resolvedVariant);
  }, [resolvedRoot, resolvedVariant]);

  const currentVoicing = variantData?.voicings[activeVoicingIndex] || variantData?.voicings[0];

  const handlePlayActiveVoicing = useCallback(() => {
    if (currentVoicing) {
      playChord(currentVoicing.frets);
    }
  }, [currentVoicing]);

  const canonicalUrl = `https://guitariz.studio/chords/${rawRoot}/${rawVariant}`;

  usePageMetadata({
    title: `${chordFullName} Guitar Chord (${chordDisplayName}) | Voicings, Tabs & Theory | Guitariz`,
    description: `Learn how to play ${chordFullName} (${chordDisplayName}) on guitar. Includes ${variantData?.voicings.length || 1}+ interactive chord diagrams, finger positions, tablature, interval formula (${variantData?.intervals || "1-3-5"}), and audio preview.`,
    keywords: `${chordDisplayName} chord, ${chordFullName} guitar chord, how to play ${chordDisplayName}, ${chordDisplayName} guitar tab, ${chordDisplayName} voicings, guitar chord library`,
    canonicalUrl,
    ogImage: "https://guitariz.studio/logo2.png",
    ogType: "article",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "MusicComposition",
      "name": `${chordFullName} Chord`,
      "musicalKey": resolvedRoot || "C",
      "description": variantData?.theoryText || `Complete guitar voicings, tablature, and theory analysis for ${chordFullName}.`,
      "url": canonicalUrl,
      "publisher": {
        "@type": "Organization",
        "name": "Guitariz Studio",
        "url": "https://guitariz.studio/"
      }
    }
  });

  if (!rootData || !variantData || !currentVoicing) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-light mb-4">Chord Not Found</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          We couldn't find guitar voicings for "{rawRoot} {rawVariant}". Check our harmonic database with 1,000+ chord diagrams.
        </p>
        <Button onClick={() => navigate("/chords")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Chord Library
        </Button>
      </div>
    );
  }

  // Other variants for the same root
  const sameRootVariants = rootData.variants.filter((v) => v.name !== variantData.name);

  // Other roots with the same variant type (e.g., all Minor 7 chords)
  const sameVariantOtherRoots = chordLibraryData.roots
    .filter((r) => r.root !== rootData.root)
    .map((r) => ({
      root: r.root,
      variant: r.variants.find((v) => v.name === variantData.name),
    }))
    .filter((item): item is { root: string; variant: typeof variantData } => Boolean(item.variant))
    .slice(0, 8);

  const faqs = [
    {
      question: `What notes make up the ${chordFullName} chord?`,
      answer: `The ${chordFullName} (${chordDisplayName}) is constructed using the interval formula: ${variantData.intervals}. ${variantData.theoryText}`
    },
    {
      question: `How many ways can I play ${chordDisplayName} on guitar?`,
      answer: `Guitariz Studio includes ${variantData.voicings.length} distinct voicing shapes for ${chordDisplayName}, ranging from open-string beginner positions to movable barre chord shapes up the neck.`
    },
    {
      question: `How do I view ${chordDisplayName} on the interactive fretboard?`,
      answer: `Click the "Open in Fretboard" button on this page to visualize this voicing across all 24 frets with interval degrees and note markers.`
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-white/10">
      <main className="container mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-16 relative z-10">
        <Breadcrumb
          items={[
            { name: "Home", url: "https://guitariz.studio/" },
            { name: "Chord Library", url: "https://guitariz.studio/chords" },
            { name: chordFullName, url: canonicalUrl },
          ]}
        />

        {/* Chord Hero Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 pb-8 border-b border-white/5">
          <div className="space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium tracking-wider uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span>Chord Analysis</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-foreground font-display">
              {chordFullName}{" "}
              <span className="text-muted-foreground font-light text-3xl md:text-5xl">
                ({chordDisplayName})
              </span>
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="text-xs px-3 py-1 bg-white/5 border-white/10 font-mono">
                Formula: {variantData.intervals}
              </Badge>
              <Badge variant="outline" className="text-xs px-3 py-1 bg-white/5 border-white/10 font-mono">
                {variantData.voicings.length} Voicing{variantData.voicings.length > 1 ? "s" : ""}
              </Badge>
              <Badge variant="outline" className="text-xs px-3 py-1 bg-primary/10 border-primary/20 text-primary font-mono capitalize">
                {currentVoicing.difficulty || "Standard"} Difficulty
              </Badge>
            </div>

            <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              {variantData.theoryText}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handlePlayActiveVoicing}
              size="lg"
              className="gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md"
            >
              <Volume2 className="w-4 h-4" /> Play Audio
            </Button>
            <Button
              onClick={() => {
                const encodedRoot = encodeURIComponent(resolvedRoot);
                const encodedVariant = encodeURIComponent(resolvedVariant);
                navigate(`/fretboard/${encodedRoot}/${encodedVariant}/${activeVoicingIndex}`);
              }}
              size="lg"
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              <Guitar className="w-4 h-4" /> Open in Fretboard
            </Button>
          </div>
        </div>

        {/* Voicings Display Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Main Selected Voicing Visualizer */}
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 bg-card/60 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Voicing Shape #{activeVoicingIndex + 1}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {currentVoicing.position === 0 ? "Open Position" : `Fret ${currentVoicing.position} Barre Position`}
                  </p>
                </div>
                <Button
                  onClick={handlePlayActiveVoicing}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-white/10 bg-white/5 hover:bg-white/10 text-xs"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Strum
                </Button>
              </div>

              {/* Diagram */}
              <div className="flex justify-center p-6 bg-black/40 rounded-2xl border border-white/5 mb-6">
                <ChordDiagram
                  frets={currentVoicing.frets}
                  fingers={currentVoicing.fingers}
                  chordName={chordDisplayName}
                />
              </div>

              {/* Tablature Grid */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  String-by-String Finger Placement
                </p>
                <div className="grid grid-cols-6 gap-2">
                  {["Low E", "A", "D", "G", "B", "High e"].map((strName, idx) => {
                    const fret = currentVoicing.frets[idx];
                    const finger = currentVoicing.fingers[idx];
                    return (
                      <div
                        key={idx}
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center"
                      >
                        <span className="text-[10px] text-muted-foreground/60 font-mono mb-1">{strName}</span>
                        <span className={`text-base font-black ${fret === -1 ? "text-muted-foreground/30" : "text-white"}`}>
                          {fret === -1 ? "×" : fret}
                        </span>
                        <span className="text-[9px] text-primary font-mono mt-1">
                          {finger === "x" ? "Mute" : finger === "0" ? "Open" : `Finger ${finger}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* All Voicings Selector */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/10 bg-card/60 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" /> Alternate Voicings ({variantData.voicings.length})
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mb-6">
                Select a shape to inspect finger positions and audio playback:
              </p>

              <div className="space-y-3">
                {variantData.voicings.map((voicing, vIdx) => {
                  const isActive = vIdx === activeVoicingIndex;
                  return (
                    <button
                      key={vIdx}
                      onClick={() => setActiveVoicingIndex(vIdx)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                        isActive
                          ? "bg-primary/10 border-primary/40 shadow-lg shadow-primary/10"
                          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                      }`}
                    >
                      <div className="space-y-1">
                        <p className={`text-sm font-bold ${isActive ? "text-primary" : "text-white"}`}>
                          Shape {vIdx + 1} — {voicing.position === 0 ? "Open Position" : `Fret ${voicing.position}`}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground">
                          Frets: [{voicing.frets.map((f) => (f === -1 ? "x" : f)).join(", ")}]
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-mono ${
                          isActive ? "border-primary/40 text-primary" : "border-white/10 text-muted-foreground"
                        }`}
                      >
                        {voicing.difficulty}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Jam / Chord AI Promo Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent border border-purple-500/20 space-y-4">
              <div className="flex items-center gap-2 text-purple-400 font-medium text-sm">
                <Music2 className="w-4 h-4" /> Practice This Chord
              </div>
              <h4 className="text-base font-bold text-white">Detect this chord in your favorite songs</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Upload any audio file or YouTube track to isolate chords with neural audio analysis in Chord AI.
              </p>
              <Link to="/chord-ai">
                <Button size="sm" className="w-full gap-2 bg-purple-600 hover:bg-purple-500 text-white mt-2">
                  Launch Chord AI <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Related Chords Navigation (Internal Link Engine) */}
        <div className="space-y-10 mb-16">
          {/* Same Root, Different Qualities */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> More {resolvedRoot} Chords
              </h3>
              <Link to="/chords" className="text-xs text-primary hover:underline flex items-center gap-1">
                All Chords <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {sameRootVariants.map((v, i) => (
                <Link
                  key={i}
                  to={getChordUrl(rootData.root, v.name)}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-primary/30 transition-all text-center group"
                >
                  <p className="text-base font-bold text-white group-hover:text-primary transition-colors">
                    {formatChordDisplayName(rootData.root, v.name)}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">{v.name}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Same Quality, Different Roots */}
          {sameVariantOtherRoots.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Music2 className="w-5 h-5 text-primary" /> Other {variantData.name} Chords
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
                {sameVariantOtherRoots.map((item, i) => (
                  <Link
                    key={i}
                    to={getChordUrl(item.root, variantData.name)}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-primary/30 transition-all text-center group"
                  >
                    <p className="text-base font-bold text-white group-hover:text-primary transition-colors">
                      {formatChordDisplayName(item.root, variantData.name)}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-mono mt-0.5">
                      {item.root.split("/")[0]}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* SEO FAQ Section */}
        <SEOContent pageName={`chord-${rawRoot}-${rawVariant}`} faqs={faqs} />

        <div className="mt-16">
          <RelatedTools currentPath="/chords" />
        </div>
      </main>
    </div>
  );
};

export default ChordDetailPage;
