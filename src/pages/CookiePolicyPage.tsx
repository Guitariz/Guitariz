import { usePageMetadata } from "@/hooks/usePageMetadata";
import { Cookie, ShieldAlert, CheckSquare, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { Breadcrumb } from "@/components/SEOContent";

const CookiePolicyPage = () => {
  usePageMetadata({
    title: "Cookie Policy | Guitariz Studio",
    description: "Read the Cookie Policy for Guitariz Studio. Understand how we use cookies, third-party services, and tracking techniques to enhance your musical learning.",
    keywords: "cookie policy, cookies, tracking, google adsense cookies, adsense consent",
    canonicalUrl: "https://guitariz.studio/cookie-policy",
    ogImage: "https://guitariz.studio/logo2.png",
    ogType: "website",
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-white/10">
      <main className="container mx-auto px-4 md:px-6 pt-24 pb-16 relative z-10 max-w-4xl">
        
        <Breadcrumb items={[
          { name: "Home", url: "https://guitariz.studio/" },
          { name: "Cookie Policy", url: "https://guitariz.studio/cookie-policy" }
        ]} />

        {/* Header Section */}
        <div className="space-y-4 mb-10 mt-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium tracking-wider uppercase">
            <Cookie className="w-4 h-4" />
            <span>Usage Settings</span>
          </div>

          <header className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-light tracking-tighter text-foreground font-display">
              Cookie <span className="text-muted-foreground font-thin italic">Policy</span>
            </h1>
            <p className="text-sm text-zinc-400">Last updated: July 20, 2026</p>
          </header>
        </div>

        {/* Content Section */}
        <div className="glass-card rounded-3xl border border-border bg-card/90 shadow-2xl p-6 md:p-10 space-y-8 text-sm md:text-base text-zinc-300 leading-relaxed">
          
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              1. What Are Cookies?
            </h2>
            <p>
              Cookies are small text files placed on your device (computer, tablet, or mobile phone) by websites that you visit. They are widely used to make websites work, or work more efficiently, as well as to provide analytics data to the site owners.
            </p>
            <p>
              In addition to cookies, we may use local browser storage (such as HTML5 LocalStorage) to keep track of user preferences, local analysis histories, and interface selections.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-450" />
              2. How We Use Cookies
            </h2>
            <p>
              Guitariz Studio uses cookies and local storage for three primary reasons:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>
                <strong className="text-white">Essential Preferences:</strong> To store your settings, such as dark mode preference, PWA installation prompts, and your local audio analysis histories so you can view past results without re-uploading files.
              </li>
              <li>
                <strong className="text-white">Anonymous Web Analytics:</strong> To monitor traffic patterns and resolve performance bottlenecks, helping us improve our free tools.
              </li>
              <li>
                <strong className="text-white">Monetization & Advertising:</strong> To serve contextual or personalized advertisements and track qualifying referrals from affiliate programs, which offsets server costs and maintains free access to our AI tools.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-450" />
              3. Categories of Cookies Used
            </h2>
            
            <div className="space-y-4 pt-2">
              <div className="p-5 rounded-2xl bg-zinc-950 border border-white/[0.04] space-y-2">
                <h3 className="text-sm font-semibold text-white">Necessary / Functional Storage (Client-side)</h3>
                <p className="text-xs text-zinc-400">
                  These do not track your personal identity. They store details like your active theme (dark mode is forced by default to maintain premium aesthetics), local chord analysis history lists (stored purely inside your browser's local storage), and session flags.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950 border border-white/[0.04] space-y-2">
                <h3 className="text-sm font-semibold text-white">Analytics Cookies (Third-party)</h3>
                <p className="text-xs text-zinc-400">
                  We use <strong className="text-white">Google Analytics (GA4)</strong> and <strong className="text-white">PostHog</strong> to understand how users interact with our features. These cookies track anonymous data such as page clicks, duration on site, browser type, and country coordinates. No raw audio files, personal names, or email addresses are tracked.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950 border border-white/[0.04] space-y-2">
                <h3 className="text-sm font-semibold text-white">Advertising Cookies & Tracking (Third-party)</h3>
                <p className="text-xs text-zinc-400">
                  We use <strong className="text-white">Google AdSense</strong> to display ads on our pages. Google uses cookies to serve ads based on your prior visits to our website or other websites on the internet. Google's use of advertising cookies enables it and its partners to serve personalized and non-personalized ads to users.
                </p>
                <p className="text-xs text-zinc-400">
                  We also display referral links under the <strong className="text-white">Amazon Associates Program</strong>. When you click on recommendations inside our Recommended Gear pages, a referral cookie is set by Amazon to track qualifying purchases and credit commissions back to support Guitariz Studio.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-450" />
              4. Managing Your Cookie Choices
            </h2>
            <p>
              You have the right to decide whether to accept or reject non-essential cookies. You can manage your preferences through the following methods:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>
                <strong className="text-white">Google Ad settings:</strong> You can opt-out of Google's personalized advertising at any time by visiting the <a href="https://adssettings.google.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline">Google Ads Settings</a> page.
              </li>
              <li>
                <strong className="text-white">Browser Controls:</strong> You can set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website, though some functionalities (such as persistent favorites or loading history) might be limited.
              </li>
              <li>
                <strong className="text-white">Third-Party Opt-Out:</strong> You can opt-out of third-party cookie tracking for personalized advertising by visiting the <a href="https://optout.aboutads.info/" target="_blank" rel="noreferrer" className="text-primary hover:underline">About Ads Opt-Out Portal</a>.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">5. Contact Us</h2>
            <p>
              If you have any questions or concerns regarding our Cookie Policy, please contact us at: 
              <br />
              <span className="text-white font-medium">support@guitariz.studio</span>
            </p>
          </section>

        </div>
      </main>
    </div>
  );
};

export default CookiePolicyPage;
