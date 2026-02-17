/**
 * Install Guide Dialog
 * Shows manual installation instructions for browsers that don't support
 * the beforeinstallprompt event (Zen, Brave, Firefox, Safari, etc.)
 */

import { motion, AnimatePresence } from "framer-motion";
import { X, Monitor, Smartphone, Chrome, Apple, Globe, MoreVertical, Share, PlusSquare } from "lucide-react";
import { useState, useEffect } from "react";

interface InstallGuideProps {
    isOpen: boolean;
    onClose: () => void;
}

type BrowserType = "chrome" | "firefox" | "safari" | "edge" | "brave" | "other";
type PlatformType = "desktop" | "mobile" | "ios";

const detectBrowser = (): BrowserType => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("brave")) return "brave";
    if (ua.includes("edg")) return "edge";
    if (ua.includes("firefox")) return "firefox";
    if (ua.includes("safari") && !ua.includes("chrome")) return "safari";
    if (ua.includes("chrome")) return "chrome";
    return "other";
};

const detectPlatform = (): PlatformType => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return "ios";
    if (/android|mobile/.test(ua)) return "mobile";
    return "desktop";
};

const browserNames: Record<BrowserType, string> = {
    chrome: "Chrome",
    firefox: "Firefox",
    safari: "Safari",
    edge: "Edge",
    brave: "Brave",
    other: "Your Browser",
};

const BrowserIcon = ({ browser }: { browser: BrowserType }) => {
    switch (browser) {
        case "safari":
            return <Apple className="w-5 h-5" />;
        case "chrome":
        case "brave":
        case "edge":
            return <Chrome className="w-5 h-5" />;
        default:
            return <Globe className="w-5 h-5" />;
    }
};

interface InstructionStep {
    icon: React.ReactNode;
    text: string;
}

const getInstructions = (browser: BrowserType, platform: PlatformType): InstructionStep[] => {
    // iOS Safari
    if (platform === "ios") {
        return [
            { icon: <Share className="w-4 h-4" />, text: "Tap the Share button at the bottom of the screen" },
            { icon: <PlusSquare className="w-4 h-4" />, text: "Scroll down and tap 'Add to Home Screen'" },
            { icon: <span className="text-sm font-bold">Add</span>, text: "Tap 'Add' in the top right corner" },
        ];
    }

    // Android Chrome / Brave
    if (platform === "mobile") {
        return [
            { icon: <MoreVertical className="w-4 h-4" />, text: "Tap the three-dot menu (⋮) in the top right" },
            { icon: <PlusSquare className="w-4 h-4" />, text: "Tap 'Add to Home screen' or 'Install app'" },
            { icon: <span className="text-sm font-bold">Install</span>, text: "Tap 'Install' to confirm" },
        ];
    }

    // Desktop browsers
    switch (browser) {
        case "chrome":
        case "edge":
            return [
                { icon: <MoreVertical className="w-4 h-4" />, text: "Click the three-dot menu (⋮) in the top right" },
                { icon: <span className="text-xs">Cast, save...</span>, text: "Go to 'Cast, save, and share' submenu" },
                { icon: <PlusSquare className="w-4 h-4" />, text: "Click 'Install Guitariz Studio'" },
            ];
        case "brave":
            return [
                { icon: <MoreVertical className="w-4 h-4" />, text: "Click the hamburger menu (☰) or three-dot menu" },
                { icon: <span className="text-xs">More tools</span>, text: "Go to 'More tools'" },
                { icon: <PlusSquare className="w-4 h-4" />, text: "Click 'Install Guitariz Studio' or look for install icon in address bar" },
            ];
        case "firefox":
            return [
                { icon: <Globe className="w-4 h-4" />, text: "Firefox doesn't support PWA installation directly" },
                { icon: <Chrome className="w-4 h-4" />, text: "For the best experience, open in Chrome, Edge, or Brave" },
                { icon: <span className="text-sm">💡</span>, text: "You can still bookmark this page for quick access" },
            ];
        case "safari":
            return [
                { icon: <Share className="w-4 h-4" />, text: "Click the Share button in the toolbar" },
                { icon: <PlusSquare className="w-4 h-4" />, text: "Click 'Add to Dock' at the bottom of the menu" },
                { icon: <span className="text-sm font-bold">Add</span>, text: "Click 'Add' in the dialog that appears" },
            ];
        default:
            return [
                { icon: <MoreVertical className="w-4 h-4" />, text: "Open the browser menu (usually three dots or lines)" },
                { icon: <PlusSquare className="w-4 h-4" />, text: "Look for 'Install', 'Add to Home Screen', or 'Add to Desktop'" },
                { icon: <span className="text-sm font-bold">Confirm</span>, text: "Follow the prompts to complete installation" },
            ];
    }
};

export const InstallGuide = ({ isOpen, onClose }: InstallGuideProps) => {
    const [browser, setBrowser] = useState<BrowserType>("other");
    const [platform, setPlatform] = useState<PlatformType>("desktop");

    useEffect(() => {
        setBrowser(detectBrowser());
        setPlatform(detectPlatform());
    }, []);

    const instructions = getInstructions(browser, platform);

    return (
        <>
            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/80 z-[300]"
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            {/* Dialog - safe centered with scroll */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-[301] flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="w-[360px] max-w-full max-h-[85vh] overflow-y-auto rounded-2xl pointer-events-auto bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/10 shadow-2xl custom-scrollbar">
                            {/* Header gradient */}
                            <div className="h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500" />

                            {/* Close button */}
                            <div className="relative">
                                <button
                                    onClick={onClose}
                                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors group z-10"
                                >
                                    <X className="w-4 h-4 text-white/40 group-hover:text-white/70" />
                                </button>
                            </div>

                            <div className="p-6">
                                {/* Title */}
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center">
                                        {platform === "mobile" || platform === "ios" ? (
                                            <Smartphone className="w-6 h-6 text-emerald-400" />
                                        ) : (
                                            <Monitor className="w-6 h-6 text-emerald-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">Install Guitariz</h3>
                                        <div className="flex items-center gap-1.5 text-sm text-white/60">
                                            <BrowserIcon browser={browser} />
                                            <span>{browserNames[browser]}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Instructions */}
                                <div className="space-y-3 mb-5">
                                    {instructions.map((step, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                                        >
                                            <div className="shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70">
                                                {step.icon}
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <span className="text-xs font-bold text-white/40 uppercase tracking-wider">
                                                    Step {index + 1}
                                                </span>
                                                <p className="text-sm text-white/80 mt-0.5">{step.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer note */}
                                <p className="text-[11px] text-center text-white/40">
                                    Installing gives you offline access and a native app experience
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default InstallGuide;
