import { useEffect } from "react";

interface PageMetadata {
    title: string;
    description: string;
    keywords?: string;
    canonicalUrl: string;
    ogUrl?: string;
    ogImage?: string;
    ogType?: "website" | "article" | "music.song" | "music.album" | "music.playlist";
    jsonLd?: Record<string, unknown>;
}

export const usePageMetadata = ({
    title,
    description,
    keywords,
    canonicalUrl,
    ogUrl,
    ogImage,
    ogType = "website",
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

        // Set meta keywords
        if (keywords) {
            let metaKeywords = document.querySelector('meta[name="keywords"]');
            if (!metaKeywords) {
                metaKeywords = document.createElement("meta");
                metaKeywords.setAttribute("name", "keywords");
                document.head.appendChild(metaKeywords);
            }
            metaKeywords.setAttribute("content", keywords);
        }

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

        // Set OpenGraph Image
        let ogImageElement = document.querySelector('meta[property="og:image"]') as HTMLMetaElement | null;
        if (!ogImageElement) {
            ogImageElement = document.createElement("meta");
            ogImageElement.setAttribute("property", "og:image");
            document.head.appendChild(ogImageElement);
        }
        ogImageElement.content = ogImage || "https://guitariz.studio/logo2.png";

        // Set OpenGraph Type
        let ogTypeElement = document.querySelector('meta[property="og:type"]') as HTMLMetaElement | null;
        if (!ogTypeElement) {
            ogTypeElement = document.createElement("meta");
            ogTypeElement.setAttribute("property", "og:type");
            document.head.appendChild(ogTypeElement);
        }
        ogTypeElement.content = ogType;

        // Set JSON-LD without duplicate blocks
        if (jsonLd) {
            const ldId = "ld-json-metadata";
            let ld = document.getElementById(ldId) as HTMLScriptElement | null;
            if (!ld) {
                // Find existing prerendered page schema (exclude breadcrumb schema)
                const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
                for (const script of existingScripts) {
                    if (!script.textContent?.includes('"BreadcrumbList"')) {
                        ld = script as HTMLScriptElement;
                        ld.id = ldId;
                        break;
                    }
                }
            }
            if (!ld) {
                ld = document.createElement("script");
                ld.type = "application/ld+json";
                ld.id = ldId;
                document.head.appendChild(ld);
            }
            ld.textContent = JSON.stringify(jsonLd);
        }
    }, [title, description, keywords, canonicalUrl, ogUrl, ogImage, ogType, jsonLd]);
};

export default usePageMetadata;
