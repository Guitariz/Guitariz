import { usePageMetadata } from "@/hooks/usePageMetadata";
import { FileText } from "lucide-react";
import { Link } from "react-router-dom";

const TermsOfServicePage = () => {
  usePageMetadata({
    title: "Terms of Service | Guitariz Studio",
    description: "Read the Terms of Service for Guitariz Studio. Understand our usage rules, copyright guidelines, and liability provisions.",
    keywords: "terms of service, terms of use, guitariz terms, copyright rules",
    canonicalUrl: "https://guitariz.studio/terms",
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-white/10">
      <main className="container mx-auto px-4 md:px-6 pt-24 pb-16 relative z-10 max-w-4xl">
        
        {/* Header Section */}
        <div className="space-y-4 mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium tracking-wider uppercase">
            <FileText className="w-4 h-4" />
            <span>Site Agreement</span>
          </div>

          <header className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-light tracking-tighter text-foreground font-display">
              Terms of <span className="text-muted-foreground font-thin italic">Service</span>
            </h1>
            <p className="text-sm text-zinc-400">Last updated: July 20, 2026</p>
          </header>
        </div>

        {/* Content Section */}
        <div className="glass-card rounded-3xl border border-border bg-card/90 shadow-2xl p-6 md:p-10 space-y-8 text-sm md:text-base text-zinc-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing and using <strong>Guitariz Studio</strong> (the "Service", located at <Link to="/" className="text-primary hover:underline">https://guitariz.studio</Link>), you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">2. Permitted Use</h2>
            <p>
              Guitariz Studio provides free AI-assisted chord recognition, audio source separation, and interactive music theory utilities.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>You may use our tools for personal, educational, or creative projects.</li>
              <li>You must not use the service to scrape data, run automated scripts against our backend, or launch denial of service attacks.</li>
              <li>We do not charge subscription fees. The tools are free to use as-is.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">3. Audio Content & Intellectual Property</h2>
            <p>
              We respect copyright and intellectual property laws:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li><strong>Your Content:</strong> We claim no ownership over the audio files you upload for analysis or stem separation. You are solely responsible for ensuring you have the legal right or license to process the audio you upload.</li>
              <li><strong>Stateless Processing:</strong> Any files uploaded to our server for separation or chord estimation are processed in memory or on temporary disk volumes, and are permanently deleted immediately after processing is complete. We do not store or redistribute your audio content.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">4. Open Source Compliance</h2>
            <p>
              Guitariz Studio uses open-source audio signal processing libraries and deep learning frameworks, including Librosa and Meta's Demucs (licensed under permissive MIT/BSD/Creative Commons structures). We comply fully with copyright attribution constraints. The full source code for the frontend application is available open-source on GitHub.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">5. Disclaimer of Warranties</h2>
            <p>
              This service is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied, including but not limited to precision of AI estimations, site availability, or server uptime. We reserve the right to limit API usage limits or modify features at any time without prior notice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">6. Limitation of Liability</h2>
            <p>
              In no event shall Guitariz Studio or its maintainers be liable for any direct, indirect, incidental, or consequential damages resulting from your use of, or inability to use, this service or its generated audio files.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">7. Governing Law</h2>
            <p>
              These Terms of Service are governed by and construed in accordance with the laws of India, without regard to its conflict of law principles.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-white">8. Contact Information</h2>
            <p>
              For legal inquiries or questions regarding these terms, please reach out to us at: 
              <br />
              <span className="text-white font-medium">guitariz.studio@gmail.com</span>
            </p>
          </section>
        </div>

      </main>
    </div>
  );
};

export default TermsOfServicePage;
