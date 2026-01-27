import { useEffect } from "react";

interface PageMetadata {
    title: string;
    description: string;
    canonicalUrl: string;
    ogUrl?: string;
    jsonLd?: Record<string, unknown>;
}

export const usePageMetadata = ({
    title,
    description,
    canonicalUrl,
    ogUrl,
    jsonLd,
}: PageMetadata) => {
    useEffect(() => {
        // Set title
        document.title = title;

        // Set meta description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement("meta");
            metaDescription.setAttribute("name", "description");
            document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute("content", description);

        // Set canonical link
        let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
        if (!canonical) {
            canonical = document.createElement("link");
            canonical.setAttribute("rel", "canonical");
            document.head.appendChild(canonical);
        }
        canonical.href = canonicalUrl;

        // Set OpenGraph URL
        let ogUrlElement = document.querySelector('meta[property="og:url"]') as HTMLMetaElement | null;
        if (!ogUrlElement) {
            ogUrlElement = document.createElement("meta");
            ogUrlElement.setAttribute("property", "og:url");
            document.head.appendChild(ogUrlElement);
        }
        ogUrlElement.content = ogUrl || canonicalUrl;

        // Set JSON-LD
        if (jsonLd) {
            const ldId = "ld-json-metadata";
            let ld = document.getElementById(ldId) as HTMLScriptElement | null;
            if (!ld) {
                ld = document.createElement("script");
                ld.type = "application/ld+json";
                ld.id = ldId;
                document.head.appendChild(ld);
            }
            ld.textContent = JSON.stringify(jsonLd);
        }

        return () => {
            // Optional: cleanup JSON-LD on unmount if it's page-specific
            const ld = document.getElementById("ld-json-metadata");
            if (ld) ld.remove();
        };
    }, [title, description, canonicalUrl, ogUrl, jsonLd]);
};

export default usePageMetadata;
