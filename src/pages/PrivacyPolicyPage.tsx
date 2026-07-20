import { usePageMetadata } from "@/hooks/usePageMetadata";
import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

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
        
        {/* Header Section */}
        <div className="space-y-4 mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>Data Protection</span>
          </div>

          <header className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-light tracking-tighter text-foreground font-display">
              Privacy <span className="text-muted-foreground font-thin italic">Policy</span>
            </h1>
            <p className="text-sm text-zinc-400">Last updated: July 20, 2026</p>
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
              Guitariz Studio offers browser-based music tools, including AI Chord Recognition (Chord AI) and Vocal Separation. 
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>We do not store your uploaded audio files on our servers.</li>
              <li>When you upload a file for separation or chord recognition, the processing is performed either fully client-side inside your browser or via secure, stateless backend API calls.</li>
              <li>Any temporary audio files uploaded to our backend endpoints are automatically purged immediately after the extraction is complete.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">3. Third-Party Advertising (Google AdSense)</h2>
            <p>
              We use third-party advertising companies, specifically <strong>Google AdSense</strong>, to serve ads when you visit our website. 
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>Google, as a third-party vendor, uses cookies to serve ads on our site.</li>
              <li>Google's use of advertising cookies enables it and its partners to serve ads to users based on their visit to our site and other sites on the internet.</li>
              <li>Users may opt-out of personalized advertising by visiting Google's Ad Settings, or by using the consent dialog interface presented upon entering our site.</li>
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
            <h2 className="text-xl font-semibold text-white">5. Website Analytics</h2>
            <p>
              To continuously improve the experience and performance of Guitariz Studio, we monitor anonymous traffic patterns using Google Analytics and PostHog. These tools use cookies to collect general usage data (such as page views, button clicks, and country locations). No personal identity information or audio metadata is sent to these third-party trackers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">6. GDPR & California Consumer Privacy Act (CCPA)</h2>
            <p>
              If you are visiting from the European Economic Area (EEA), United Kingdom, or California:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>We request explicit consent to place advertising and tracking cookies before loading them on your browser.</li>
              <li>You have the right to withdraw consent or change your cookie choices at any time using the Cookie Preferences controls.</li>
              <li>Since we do not collect personal profiles or email registrations, we do not hold identifiable personal data databases.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">7. Changes to this Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. Any changes will be posted on this page with the updated revision date.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at: 
              <br />
              <span className="text-white font-medium">guitariz.studio@gmail.com</span>
            </p>
          </section>
        </div>

      </main>
    </div>
  );
};

export default PrivacyPolicyPage;
