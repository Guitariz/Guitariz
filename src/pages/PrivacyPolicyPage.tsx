import { usePageMetadata } from "@/hooks/usePageMetadata";
import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Breadcrumb } from "@/components/SEOContent";

const PrivacyPolicyPage = () => {
  usePageMetadata({
    title: "Privacy Policy | Guitariz Studio",
    description: "Read the Privacy Policy for Guitariz Studio. Learn how we handle your audio uploads, cookies, and data security.",
    keywords: "privacy policy, guitariz, data collection, cookies, adsense privacy policy",
    canonicalUrl: "https://guitariz.studio/privacy",
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-white/10">
      <main className="container mx-auto px-4 md:px-6 pt-24 pb-16 relative z-10 max-w-4xl">
        
        <Breadcrumb items={[
          { name: "Home", url: "https://guitariz.studio/" },
          { name: "Privacy Policy", url: "https://guitariz.studio/privacy" }
        ]} />

        {/* Header Section */}
        <div className="space-y-4 mb-10 mt-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>Data Protection</span>
          </div>

          <header className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-light tracking-tighter text-foreground font-display">
              Privacy <span className="text-muted-foreground font-thin italic">Policy</span>
            </h1>
            <p className="text-sm text-zinc-400">Last updated: August 24, 2026</p>
          </header>
        </div>

        {/* Content Section */}
        <div className="glass-card rounded-3xl border border-border bg-card/90 shadow-2xl p-6 md:p-10 space-y-8 text-sm md:text-base text-zinc-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
            <p>
              Welcome to <strong>Guitariz Studio</strong> (accessible at <Link to="/" className="text-primary hover:underline">https://guitariz.studio</Link>). We respect your privacy and are committed to protecting any information we collect. This Privacy Policy details how we handle user files, analytical tracking, and advertising cookies.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">2. Audio Uploads & Processing</h2>
            <p>
              Guitariz Studio provides browser-based music tools including AI Chord Recognition (Chord AI), Stem Separation, and Key/BPM Detection. We handle audio data with strict privacy safeguards:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li><strong className="text-white">Input Files:</strong> Raw audio files uploaded for chord recognition or stem separation are processed via temporary server-side files (written to ephemeral temporary disk space and deleted immediately upon analysis completion).</li>
              <li><strong className="text-white">Separated Output Stems:</strong> When you generate separated stems (vocals, drums, bass, instruments), the generated download files are held in temporary scratch storage for up to 1 hour to allow you time to download them, after which they are permanently deleted by an automated cleanup process.</li>
              <li><strong className="text-white">No Cloud Storage:</strong> We do not upload, retain, or train on your audio files in permanent cloud databases or S3 storage buckets.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">3. Third-Party Advertising (Google AdSense & Monetag)</h2>
            <p>
              We partner with third-party advertising networks, including <strong>Google AdSense</strong> and <strong>Monetag</strong>, to serve contextual and personalized advertisements across our website to support our free tools.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>Third-party vendors use cookies and device identifiers to serve ads based on prior visits to our website or other sites on the internet.</li>
              <li>Google's use of advertising cookies enables it and its partners to serve ads based on your visits to our site and other internet destinations.</li>
              <li>Monetag operates an ad delivery engine that may utilize web cookies and anonymous session tokens to serve display, in-page, and banner ad formats.</li>
              <li>Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer" className="text-primary hover:underline">Google Ads Settings</a> or through <a href="https://www.aboutads.info/choices/" target="_blank" rel="noreferrer" className="text-primary hover:underline">www.aboutads.info</a>.</li>
              <li>To learn more about how Google collects and processes data, review <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noreferrer" className="text-primary hover:underline">How Google uses information from sites or apps that use our services</a>.</li>
              <li>For detailed information on our cookie usage and management options, please read our dedicated <Link to="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link>.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">4. Affiliate Programs Disclosure (Amazon Associates)</h2>
            <p>
              Guitariz Studio is a participant in the Amazon Services LLC Associates Program (and its local equivalents, such as the Amazon.in Associates Program), an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com, Amazon.in, and affiliated sites.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>As an Amazon Associate, we earn from qualifying purchases.</li>
              <li>When you click on affiliate links on this site and make a purchase, we may receive a small commission at no additional cost to you. This helps support the infrastructure and maintenance of our free tools.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">5. Website Analytics & Performance Monitoring</h2>
            <p>
              To monitor traffic patterns, diagnose technical issues, and improve platform performance, we utilize the following analytics services:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li><strong className="text-white">Google Analytics 4 (GA4):</strong> Collects aggregated metrics on pageviews, browser types, and general geographic regions.</li>
              <li><strong className="text-white">PostHog:</strong> Tracks anonymous product interactions and feature usage (session recording and keystroke tracking are strictly disabled).</li>
              <li><strong className="text-white">Ahrefs Web Analytics:</strong> Measures anonymous site traffic and technical web health.</li>
              <li><strong className="text-white">Vercel Analytics & Speed Insights:</strong> Monitors real-world Core Web Vitals (LCP, CLS, FID) and edge routing performance.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">6. Contact Form & Communications (Web3Forms)</h2>
            <p>
              When you send an inquiry through our Contact Form, your name, email address, subject, and message are securely transmitted to our backend delivery provider, <strong>Web3Forms</strong>, to route the message to our support inbox (<span className="text-white font-medium">support@guitariz.studio</span>). This information is used solely to respond to your inquiry and is never sold or used for marketing.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">7. YouTube Embedded Player</h2>
            <p>
              Certain tools (such as Chord AI YouTube practice integration) utilize the YouTube IFrame Player API. When you load or play YouTube videos on our site, YouTube/Google may set cookies and collect usage metrics per <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-primary hover:underline">Google's Privacy Policy</a>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">8. GDPR & California Consumer Privacy Act (CCPA)</h2>
            <p>
              If you are visiting from the European Economic Area (EEA), United Kingdom, or California:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>We request explicit consent to place advertising and tracking cookies before loading them on your browser.</li>
              <li>You have the right to withdraw consent or change your cookie choices at any time using the Cookie Preferences controls.</li>
              <li>We do not maintain user accounts or persistent personal data databases. The only personal information we process is what you voluntarily submit via our Contact Form, which is used solely to respond to your inquiry and is not stored in a persistent database by us.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">9. Changes to this Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. Any changes will be posted on this page with the updated revision date.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at: 
              <br />
              <span className="text-white font-medium">support@guitariz.studio</span>
            </p>
          </section>
        </div>

      </main>
    </div>
  );
};

export default PrivacyPolicyPage;
