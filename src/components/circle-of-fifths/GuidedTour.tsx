import { CheckCircle2, ArrowRight, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuidedTourProps {
  currentStep: number; // 0 to 4
  onNextStep: () => void;
  onSkipTour: () => void;
  onRestartTour: () => void;
  selectedKey: string | null;
}

export const GuidedTour = ({
  currentStep,
  onNextStep,
  onSkipTour,
  onRestartTour,
  selectedKey,
}: GuidedTourProps) => {
  const steps = [
    {
      title: "Step 1: The Root Key",
      prompt: "Click any key on the wheel to begin exploring.",
      actionLabel: "Click [ C ]",
      hint: "C Major has 0 sharps and 0 flats.",
      expected: "C",
    },
    {
      title: "Step 2: Clockwise Motion (+1 Sharp)",
      prompt: "Great! Notice G? Moving clockwise adds one sharp.",
      actionLabel: "Try clicking [ G ]",
      hint: "G Major has 1 sharp (F#). It is the Dominant of C.",
      expected: "G",
    },
    {
      title: "Step 3: Counter-Clockwise Motion (+1 Flat)",
      prompt: "Now try F. Moving counter-clockwise adds one flat.",
      actionLabel: "Try clicking [ F ]",
      hint: "F Major has 1 flat (Bb). It is the Subdominant of C.",
      expected: "F",
    },
    {
      title: "Step 4: Relative Minor",
      prompt: "See the Relative Minor? Am shares all notes with C Major.",
      actionLabel: "Select C or view Am",
      hint: "Relative minor shares the exact same key signature.",
      expected: "Am",
    },
  ];

  if (currentStep >= 4) {
    return (
      <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-5 rounded-2xl bg-card border-2 border-emerald-500/50 shadow-2xl text-foreground animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>Nice! Tutorial Complete</span>
          </div>
          <button onClick={onSkipTour} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 text-xs space-y-1 text-muted-foreground">
          <div className="flex items-center gap-1.5 text-foreground font-medium">
            <span>✔ Fifths (+5th Clockwise)</span>
          </div>
          <div className="flex items-center gap-1.5 text-foreground font-medium">
            <span>✔ Fourths (+4th Counter-Clockwise)</span>
          </div>
          <div className="flex items-center gap-1.5 text-foreground font-medium">
            <span>✔ Relative Minors</span>
          </div>
          <div className="flex items-center gap-1.5 text-foreground font-medium">
            <span>✔ Diatonic Key Signatures</span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={onRestartTour}
            className="flex-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold transition-colors"
          >
            Restart Tour
          </button>
          <button
            onClick={onSkipTour}
            className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400 text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  const step = steps[currentStep];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4">
      <div className="p-4 sm:p-5 rounded-2xl bg-card/95 border-2 border-primary/50 shadow-2xl backdrop-blur-xl text-foreground flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {step.title}
            </span>
          </div>
          <button onClick={onSkipTour} className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1">
            <span>Skip</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">{step.prompt}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">{step.hint}</p>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-white/10">
          <div className="text-[10px] text-muted-foreground">
            Step {currentStep + 1} of 4
          </div>
          <button
            onClick={onNextStep}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow"
          >
            <span>Next</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
