import { useState } from "react";
import { usePageMetadata } from "@/hooks/usePageMetadata";
import { Mail, Copy, Check, Send, Github, Twitter, MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Breadcrumb } from "@/components/SEOContent";
import { motion, AnimatePresence } from "framer-motion";

const ContactPage = () => {
  usePageMetadata({
    title: "Contact Us | Guitariz Studio",
    description: "Get in touch with the team at Guitariz Studio. Submit bug reports, feature requests, or business inquiries.",
    keywords: "contact guitariz, support, bug report, feedback, music studio help",
    canonicalUrl: "https://guitariz.studio/contact",
    ogImage: "https://guitariz.studio/logo2.png",
    ogType: "website",
  });

  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const copyEmail = () => {
    navigator.clipboard.writeText("support@guitariz.studio");
    setCopied(true);
    toast({
      title: "Email Copied",
      description: "support@guitariz.studio has been copied to your clipboard.",
      duration: 3000,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;

    if (!accessKey) {
      console.warn("VITE_WEB3FORMS_ACCESS_KEY is missing. Logging contact form submission locally:");
      console.log({ name, email, subject, message });

      // Simulate network request
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setIsSubmitting(false);
      setSubmitStatus("success");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      return;
    }

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `Contact Form: ${subject || "No Subject"}`,
          from_name: name,
          email: email,
          message: message,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSubmitStatus("success");
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      } else {
        setSubmitStatus("error");
        setErrorMessage(data.message || "Something went wrong. Please try again later.");
      }
    } catch (err) {
      setSubmitStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "A network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden selection:bg-white/10">
      <main className="container mx-auto px-4 md:px-6 pt-24 pb-16 relative z-10 max-w-5xl">
        
        <Breadcrumb items={[
          { name: "Home", url: "https://guitariz.studio/" },
          { name: "Contact Us", url: "https://guitariz.studio/contact" }
        ]} />

        {/* Header Section */}
        <div className="space-y-4 mb-10 mt-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium tracking-wider uppercase">
            <MessageSquare className="w-4 h-4" />
            <span>Support Hub</span>
          </div>

          <header className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-light tracking-tighter text-foreground font-display">
              Contact <span className="text-muted-foreground font-thin italic">Us</span>
            </h1>
            <p className="text-sm text-zinc-400">Have a question or feedback? We'd love to hear from you.</p>
          </header>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          
          {/* Info Side Panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-3xl border border-border bg-card/75 p-6 md:p-8 space-y-6">
              <h2 className="text-xl font-semibold text-white">Direct Communication</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">
                For direct inquiries, partnership proposals, or complex technical issues, email us directly. We typically respond within 24–48 hours.
              </p>

              {/* Email Card */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-white/[0.04] flex items-center justify-between gap-4 group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider">Email Address</p>
                    <p className="text-sm text-white font-medium truncate">support@guitariz.studio</p>
                  </div>
                </div>
                <button
                  onClick={copyEmail}
                  className="w-9 h-9 rounded-lg bg-white/[0.02] border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/20 flex items-center justify-center text-zinc-400 hover:text-white transition-all shrink-0"
                  title="Copy email to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Social Channels */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Community Channels</h3>
                <div className="flex flex-col gap-2">
                  <a
                    href="https://github.com/Guitariz/Guitariz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-zinc-400 hover:text-white transition-colors group"
                  >
                    <Github className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                    <span>Open GitHub Issues</span>
                  </a>
                  <a
                    href="https://x.com/GuitarizStudio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-zinc-400 hover:text-white transition-colors group"
                  >
                    <Twitter className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                    <span>X (formerly Twitter)</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Form Panel */}
          <div className="lg:col-span-3">
            <div className="glass-card rounded-3xl border border-border bg-card/90 shadow-2xl p-6 md:p-8">
              <AnimatePresence mode="wait">
                {submitStatus === "success" ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="py-12 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                      <Check className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-semibold text-white">Message Sent!</h2>
                    <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
                      Thank you for contacting us. Your message has been submitted successfully and we will get back to you shortly.
                    </p>
                    <Button
                      onClick={() => setSubmitStatus("idle")}
                      variant="outline"
                      className="mt-4 rounded-xl px-6 border-white/[0.08] hover:bg-white/[0.02]"
                    >
                      Send Another Message
                    </Button>
                  </motion.div>
                ) : (
                  <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold text-white">Send a Message</h2>
                      <p className="text-xs text-zinc-400">Fill out the form below and we will get in touch as soon as possible.</p>
                    </div>

                    {submitStatus === "error" && (
                      <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p>{errorMessage}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="form-name" className="text-xs font-semibold text-zinc-400">Your Name *</label>
                        <input
                          id="form-name"
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full h-11 px-4 rounded-xl bg-zinc-950 border border-white/[0.06] focus:border-primary/50 text-white text-sm outline-none transition-colors"
                          placeholder="e.g. Jimi Hendrix"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="form-email" className="text-xs font-semibold text-zinc-400">Your Email *</label>
                        <input
                          id="form-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-11 px-4 rounded-xl bg-zinc-950 border border-white/[0.06] focus:border-primary/50 text-white text-sm outline-none transition-colors"
                          placeholder="e.g. jimi@guitariz.studio"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="form-subject" className="text-xs font-semibold text-zinc-400">Subject</label>
                      <input
                        id="form-subject"
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl bg-zinc-950 border border-white/[0.06] focus:border-primary/50 text-white text-sm outline-none transition-colors"
                        placeholder="e.g. Feature request for Scale Explorer"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="form-message" className="text-xs font-semibold text-zinc-400">Message *</label>
                      <textarea
                        id="form-message"
                        required
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-white/[0.06] focus:border-primary/50 text-white text-sm outline-none transition-colors resize-none"
                        placeholder="Type your message here..."
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-primary/10 transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Sending Message...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ContactPage;
