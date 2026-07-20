import { usePageMetadata } from "@/hooks/usePageMetadata";
import { Breadcrumb } from "@/components/SEOContent";
import { ExternalLink, Guitar, Headphones, BookOpen, Cable } from "lucide-react";
import RelatedTools from "@/components/RelatedTools";

const AFFILIATE_TAG = "guitariz-21";

const buildLink = (query: string): string => {
  if (query.startsWith("http")) {
    const sep = query.includes("?") ? "&" : "?";
    return `${query}${sep}tag=${AFFILIATE_TAG}`;
  }
  return `https://www.amazon.in/s?k=${encodeURIComponent(query)}&tag=${AFFILIATE_TAG}`;
};

interface GearItem {
  name: string;
  description: string;
  query: string;
  priceRange: string;
}

interface GearCategory {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  items: GearItem[];
}

const gearCategories: GearCategory[] = [
  {
    title: "Guitar Essentials",
    subtitle: "Must-have accessories for every guitarist",
    icon: Guitar,
    items: [
      {
        name: "Clip-on Guitar Tuner",
        description: "Accurate tuning even in noisy environments. Essential if you can't use a phone mic.",
        query: "clip on guitar tuner chromatic",
        priceRange: "₹250 – ₹1,500",
      },
      {
        name: "Guitar Capo",
        description: "Instantly change the key of any song. A must-have for playing along with recordings.",
        query: "guitar capo acoustic electric",
        priceRange: "₹150 – ₹1,200",
      },
      {
        name: "Guitar Strings (Acoustic)",
        description: "Fresh strings make a huge difference in tone and playability. Change them every 2-3 months.",
        query: "acoustic guitar strings set",
        priceRange: "₹200 – ₹800",
      },
      {
        name: "Guitar Picks Variety Pack",
        description: "Different thicknesses for strumming vs. lead playing. Every guitarist needs a good selection.",
        query: "guitar picks variety pack",
        priceRange: "₹100 – ₹400",
      },
      {
        name: "Guitar Strap",
        description: "Play standing up comfortably. Essential for practice sessions and performances.",
        query: "guitar strap adjustable",
        priceRange: "₹200 – ₹1,000",
      },
    ],
  },
  {
    title: "Audio & Production Gear",
    subtitle: "Recommended for Chord AI and Stem Separation users",
    icon: Headphones,
    items: [
      {
        name: "Studio Monitor Headphones",
        description: "Hear every detail in your separated stems. Flat-response headphones reveal what speakers can't.",
        query: "studio monitor headphones Audio Technica",
        priceRange: "₹1,500 – ₹8,000",
      },
      {
        name: "USB Audio Interface",
        description: "Record guitar directly into your computer with zero latency. Essential for home studios.",
        query: "USB audio interface guitar recording",
        priceRange: "₹3,000 – ₹12,000",
      },
      {
        name: "Condenser Microphone (USB)",
        description: "High-quality vocal and instrument recording without an audio interface.",
        query: "USB condenser microphone recording",
        priceRange: "₹1,500 – ₹5,000",
      },
      {
        name: "6.35mm to 3.5mm Adapter",
        description: "Connect studio headphones to your phone or laptop. A cheap cable everyone needs.",
        query: "6.35mm to 3.5mm headphone adapter",
        priceRange: "₹100 – ₹300",
      },
    ],
  },
  {
    title: "Cables & Accessories",
    subtitle: "Small things that make a big difference",
    icon: Cable,
    items: [
      {
        name: "Guitar Cable (Instrument Cable)",
        description: "A reliable, low-noise cable for connecting your guitar to amps or interfaces.",
        query: "guitar instrument cable 3m",
        priceRange: "₹200 – ₹1,500",
      },
      {
        name: "Guitar Stand",
        description: "Keep your guitar safe and always ready to play. A guitar on a stand gets played more often.",
        query: "guitar stand folding",
        priceRange: "₹300 – ₹1,200",
      },
      {
        name: "Music Sheet Stand",
        description: "Hold your phone, tablet, or sheet music at eye level while you practice.",
        query: "music sheet stand adjustable",
        priceRange: "₹400 – ₹1,500",
      },
    ],
  },
  {
    title: "Books & Learning",
    subtitle: "Level up your theory and technique",
    icon: BookOpen,
    items: [
      {
        name: "Hal Leonard Guitar Method",
        description: "The best-selling guitar method book worldwide. Great for structured learning.",
        query: "Hal Leonard guitar method book",
        priceRange: "₹300 – ₹1,500",
      },
      {
        name: "Music Theory for Guitarists",
        description: "Understand the theory behind scales, chords, and progressions on the fretboard.",
        query: "music theory book guitar",
        priceRange: "₹300 – ₹1,200",
      },
      {
        name: "Indian Raga Guide",
        description: "Explore the depth of Hindustani and Carnatic music theory for guitar and keyboard.",
        query: "Indian raga music theory book",
        priceRange: "₹250 – ₹1,000",
      },
    ],
  },
];

const GearPage = () => {
  usePageMetadata({
    title: "Recommended Gear for Musicians | Guitariz Studio",
    description:
      "Hand-picked gear recommendations for guitarists and producers. Tuners, capos, headphones, audio interfaces, and music theory books curated by Guitariz Studio.",
    keywords:
      "guitar gear, guitar accessories, studio headphones, audio interface, guitar capo, guitar tuner, music theory books",
    canonicalUrl: "https://guitariz.studio/gear",
    ogImage: "https://guitariz.studio/logo2.png",
    ogType: "website",
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-white/10">
      <main className="container mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-16 relative z-10">
        <div className="max-w-5xl mx-auto">
          <Breadcrumb
            items={[
              { name: "Home", url: "https://guitariz.studio/" },
              { name: "Gear", url: "https://guitariz.studio/gear" },
            ]}
          />

          {/* Header */}
          <div className="mb-16 text-center space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-400 text-[10px] font-bold tracking-[0.2em] uppercase shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <Guitar className="w-3 h-3" />
              <span>Musician's Toolbox</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-light tracking-tighter text-foreground">
                Recommended{" "}
                <span className="text-amber-400 font-normal">Gear</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
                Hand-picked tools, accessories, and books that we genuinely
                recommend for guitarists and home producers.
              </p>
            </div>
          </div>

          {/* Gear Categories */}
          <div className="space-y-16">
            {gearCategories.map((category) => (
              <section key={category.title}>
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-2">
                  <category.icon className="w-5 h-5 text-amber-400/70" />
                  <h2 className="text-2xl font-semibold text-white tracking-tight">
                    {category.title}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground mb-6 ml-8">
                  {category.subtitle}
                </p>

                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.items.map((item) => (
                    <a
                      key={item.name}
                      href={buildLink(item.query)}
                      target="_blank"
                      rel="noopener noreferrer nofollow sponsored"
                      className="group relative flex flex-col p-5 rounded-2xl border border-border hover:border-amber-500/30 bg-card/50 hover:bg-card/80 transition-all duration-300 hover:shadow-[0_0_30px_rgba(245,158,11,0.05)]"
                    >
                      <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors flex items-center gap-2">
                        {item.name}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed flex-1">
                        {item.description}
                      </p>
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <span className="text-[10px] text-amber-400/60 font-medium tracking-wide uppercase">
                          {item.priceRange}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="mt-16 text-center">
            <p className="text-[10px] text-zinc-500 max-w-lg mx-auto leading-relaxed">
              As an Amazon Associate, Guitariz Studio earns from qualifying
              purchases. These recommendations are based on our genuine
              experience and are not paid placements. Prices are approximate and
              may vary.
            </p>
          </div>
        </div>

        <RelatedTools currentPath="/gear" />
      </main>
    </div>
  );
};

export default GearPage;
