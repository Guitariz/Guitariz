import { ExternalLink, Lightbulb } from "lucide-react";

interface GearTipProps {
  /** The tip message to show — can include inline elements but the link is separate */
  tip: string;
  /** The product name to display as the link text */
  productName: string;
  /** Amazon.in search query or product path — affiliate tag is appended automatically */
  amazonQuery: string;
  /** Optional className override */
  className?: string;
}

const AFFILIATE_TAG = "guitariz-21";

/**
 * Builds an Amazon.in affiliate link.
 * Uses search URLs for reliability (never 404s, user sees choices).
 */
const buildAffiliateLink = (query: string): string => {
  // If it's already a full URL or product path, append the tag
  if (query.startsWith("http")) {
    const sep = query.includes("?") ? "&" : "?";
    return `${query}${sep}tag=${AFFILIATE_TAG}`;
  }
  // Otherwise build a search URL
  return `https://www.amazon.in/s?k=${encodeURIComponent(query)}&tag=${AFFILIATE_TAG}`;
};

/**
 * A small, elegant gear recommendation tip that blends naturally into pages.
 * Designed to be helpful and non-intrusive, not spammy.
 */
const GearTip = ({ tip, productName, amazonQuery, className = "" }: GearTipProps) => {
  return (
    <div
      className={`group relative flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-500/10 bg-amber-500/[0.03] hover:bg-amber-500/[0.06] transition-colors duration-300 ${className}`}
    >
      <Lightbulb className="w-4 h-4 text-amber-400/70 mt-0.5 flex-shrink-0" />
      <p className="text-xs text-zinc-400 leading-relaxed">
        {tip}{" "}
        <a
          href={buildAffiliateLink(amazonQuery)}
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
          className="inline-flex items-center gap-1 text-amber-400/80 hover:text-amber-300 transition-colors font-medium"
        >
          {productName}
          <ExternalLink className="w-3 h-3" />
        </a>
      </p>
    </div>
  );
};

export default GearTip;
