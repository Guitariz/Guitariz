import { useEffect } from "react";

interface AdSenseUnitProps {
  client?: string;
  slot: string;
  format?: string;
  responsive?: string;
  minHeight?: number | string;
  style?: React.CSSProperties;
  className?: string;
}

export const AdSenseUnit = ({
  client = "ca-pub-5158668243904136",
  slot,
  format = "auto",
  responsive = "true",
  minHeight = "100px",
  style = { display: "block" },
  className = "",
}: AdSenseUnitProps) => {
  useEffect(() => {
    try {
      // @ts-expect-error: adsbygoogle is added by index.html script tag
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error: ", e);
    }
  }, []);

  const minHeightStyle = typeof minHeight === "number" ? `${minHeight}px` : minHeight;

  return (
    <div
      className={`adsense-wrapper overflow-hidden my-4 flex justify-center items-center ${className}`}
      style={{ minHeight: minHeightStyle, contain: "layout" }}
    >
      <ins
        className="adsbygoogle"
        style={{ minWidth: "250px", width: "100%", ...style }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
};
