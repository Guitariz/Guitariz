import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquarePlus, X, Send, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

// Web3Forms API Endpoint
const WEB3FORMS_URL = "https://api.web3forms.com/submit";

type CategoryType = "bug" | "idea" | "praise" | "other";

interface FeedbackFormData {
  access_key: string;
  subject: string;
  from_name: string;
  category: string;
  rating: string;
  email: string;
  message: string;
}

export const FeedbackModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<CategoryType>("idea");
  const [rating, setRating] = useState<number>(4); // 1-4 scale mapping to emojis
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Reset form when opened/closed
  const toggleModal = () => {
    if (!isOpen) {
      setCategory("idea");
      setRating(4);
      setEmail("");
      setMessage("");
      setSubmitStatus("idle");
    }
    setIsOpen(!isOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setSubmitStatus("idle");

    const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;

    // Development fallback if key is missing
    if (!accessKey) {
      console.warn("VITE_WEB3FORMS_ACCESS_KEY is missing. Logging feedback locally:");
      console.log({
        category,
        rating: `${rating}/4`,
        email: email || "anonymous",
        message,
      });

      // Simulate network request
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsSubmitting(false);
      setSubmitStatus("success");

      // Auto close modal after success
      setTimeout(() => {
        setIsOpen(false);
      }, 2500);
      return;
    }

    const ratingLabels = ["😢 Disappointed", "😐 Neutral", "🙂 Pleased", "😍 Loving It!"];
    const ratingText = ratingLabels[rating - 1] || `${rating}/4`;

    const formData: FeedbackFormData = {
      access_key: accessKey,
      subject: `[Guitariz Feedback] ${category.toUpperCase()} - ${ratingText}`,
      from_name: "Guitariz User",
      category,
      rating: ratingText,
      email: email || "anonymous@guitariz.studio",
      message,
    };

    try {
      const response = await fetch(WEB3FORMS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.status === 200 || result.success) {
        setSubmitStatus("success");
        setTimeout(() => {
          setIsOpen(false);
        }, 2500);
      } else {
        throw new Error(result.message || "Failed to send feedback");
      }
    } catch (err) {
      console.error("Feedback submit error:", err);
      setSubmitStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { id: "bug", label: "Bug Report", emoji: "🐛", color: "border-rose-500/20 active:bg-rose-500/10 text-rose-400 bg-rose-500/5 hover:border-rose-500/35" },
    { id: "idea", label: "Suggestion", emoji: "💡", color: "border-cyan-500/20 active:bg-cyan-500/10 text-cyan-400 bg-cyan-500/5 hover:border-cyan-500/35" },
    { id: "praise", label: "Praise", emoji: "❤️", color: "border-emerald-500/20 active:bg-emerald-500/10 text-emerald-400 bg-emerald-500/5 hover:border-emerald-500/35" },
    { id: "other", label: "Other", emoji: "❓", color: "border-zinc-500/20 active:bg-zinc-500/10 text-zinc-400 bg-zinc-500/5 hover:border-zinc-500/35" },
  ];

  const ratingEmojis = [
    { value: 1, char: "😢", label: "Bad" },
    { value: 2, char: "😐", label: "Okay" },
    { value: 3, char: "🙂", label: "Good" },
    { value: 4, char: "😍", label: "Love it" },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={toggleModal}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        aria-label="Submit Feedback"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center gap-2 px-4 py-3.5 rounded-full bg-zinc-950/80 hover:bg-zinc-900 border border-white/10 hover:border-white/20 text-white backdrop-blur-md shadow-2xl transition-all group overflow-hidden"
      >
        <MessageSquarePlus className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform duration-300" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out font-medium text-xs tracking-wide whitespace-nowrap">
          Feedback
        </span>
      </motion.button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleModal}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md bg-[#0a0a0a]/90 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={toggleModal}
                aria-label="Close modal"
                className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <AnimatePresence mode="wait">
                {submitStatus === "success" ? (
                  /* Success State */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center justify-center text-center py-10 space-y-4"
                  >
                    <div className="relative">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                        className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center"
                      >
                        <CheckCircle2 className="w-8 h-8" />
                      </motion.div>
                      <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-400 animate-pulse" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-xl font-medium text-white font-display">Feedback Sent!</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
                        Thank you for helping us grow Guitariz. We read every single submission!
                      </p>
                    </div>
                  </motion.div>
                ) : submitStatus === "error" ? (
                  /* Error State */
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center justify-center text-center py-8 space-y-4"
                  >
                    <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-8 h-8" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-xl font-medium text-white font-display">Submission Failed</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed max-w-xs">
                        {errorMessage || "We couldn't deliver your feedback due to a connection issue."}
                      </p>
                      <p className="text-xs text-zinc-500 max-w-xs">
                        Please try again or email us directly at <span className="text-white">guitariz.studio@gmail.com</span>.
                      </p>
                    </div>
                    <button
                      onClick={() => setSubmitStatus("idle")}
                      className="mt-4 px-5 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/[0.03] text-xs font-semibold text-white transition-all"
                    >
                      Try Again
                    </button>
                  </motion.div>
                ) : (
                  /* Main Form State */
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="mb-6 space-y-1.5">
                      <h3 className="text-xl font-semibold text-white font-display">Feedback & Ideas</h3>
                      <p className="text-xs text-zinc-500 leading-normal">
                        Spotted a bug? Have an idea? Share it here - we'd love to hear from you :)
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Category Selection */}
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-650 font-bold">Category</label>
                        <div className="grid grid-cols-2 gap-2">
                          {categories.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setCategory(cat.id as CategoryType)}
                              className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-xs font-semibold ${
                                category === cat.id
                                  ? cat.color + " border-opacity-100 ring-1 ring-white/10 shadow-lg scale-[1.02]"
                                  : "border-white/5 bg-white/[0.01] text-zinc-400 hover:border-white/10 hover:text-white"
                              }`}
                            >
                              <span>{cat.emoji}</span>
                              <span>{cat.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Emoji Rating */}
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-650 font-bold">Experience</label>
                        <div className="flex justify-between items-center bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                          {ratingEmojis.map((emoji) => (
                            <button
                              key={emoji.value}
                              type="button"
                              onClick={() => setRating(emoji.value)}
                              className="group flex flex-col items-center gap-1 transition-all"
                            >
                              <motion.span
                                whileHover={{ scale: 1.25 }}
                                whileTap={{ scale: 0.9 }}
                                className={`text-2xl transition-opacity ${
                                  rating === emoji.value
                                    ? "opacity-100 scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                                    : "opacity-40 group-hover:opacity-75"
                                }`}
                              >
                                {emoji.char}
                              </motion.span>
                              <span
                                className={`text-[9px] transition-colors font-medium ${
                                  rating === emoji.value ? "text-white" : "text-zinc-600"
                                }`}
                              >
                                {emoji.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Message Field */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest text-zinc-650 font-bold">Your Message</label>
                        <textarea
                          required
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder={
                            category === "bug"
                              ? "Please describe the issue, what tool you were using, and how we can replicate it..."
                              : category === "idea"
                              ? "Describe your suggestion. What feature would make Guitariz better for you?"
                              : "Write your message here..."
                          }
                          rows={4}
                          className="w-full bg-white/[0.02] hover:bg-white/[0.03] border border-white/5 focus:border-white/20 focus:ring-1 focus:ring-white/20 rounded-xl p-3.5 text-xs text-white placeholder:text-zinc-650 focus:outline-none transition-all resize-none leading-relaxed font-medium"
                        />
                      </div>

                      {/* Email Field (Optional) */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase tracking-widest text-zinc-650 font-bold">Email Address</label>
                          <span className="text-[8px] text-zinc-550 uppercase tracking-widest">Optional</span>
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="yourname@example.com"
                          className="w-full bg-white/[0.02] hover:bg-white/[0.03] border border-white/5 focus:border-white/20 focus:ring-1 focus:ring-white/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-650 focus:outline-none transition-all font-medium"
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting || !message.trim()}
                        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-white text-black hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-555 font-semibold text-xs transition-all cursor-pointer shadow-lg hover:shadow-white/5"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-400 border-t-black animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Send Feedback</span>
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackModal;
