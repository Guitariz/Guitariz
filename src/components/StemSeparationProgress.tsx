import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StemSeparationProgressProps {
  uploadProgress: number | null;
  fileDuration: number | null;
  isSixStems?: boolean;
}

type Stage = "uploading" | "loading" | "analyzing" | "separating" | "finalizing";

export const StemSeparationProgress = ({
  uploadProgress,
  fileDuration,
  isSixStems = false,
}: StemSeparationProgressProps) => {
  const [currentStage, setCurrentStage] = useState<Stage>("uploading");
  const [simulatedProgress, setSimulatedProgress] = useState(0);

  // Fallback duration in seconds if not provided
  const duration = fileDuration || 210; 

  useEffect(() => {
    // 1. Upload Stage: Map directly to actual uploadProgress
    if (uploadProgress !== null && uploadProgress < 100) {
      setCurrentStage("uploading");
      setSimulatedProgress(Math.round(uploadProgress * 0.15)); // Upload stage is 0% to 15% of total UI progress
      return;
    }

    // If upload is complete and we were uploading, move to loading
    if (currentStage === "uploading") {
      setCurrentStage("loading");
      setSimulatedProgress(15);
    }
  }, [uploadProgress, currentStage]);

  useEffect(() => {
    if (currentStage === "uploading") return;

    // Estimate total processing duration
    // Vocal splitter (2-stem) is faster: e.g. ~45 seconds on average
    // Stem separator (6-stem) is slower: e.g. ~120 seconds on average
    const baseDuration = isSixStems ? 150 : 60;
    // Scale slightly with song duration (e.g. longer song = longer processing)
    const estimatedDuration = baseDuration + Math.round((duration - 180) * 0.25);

    const stepTime = 1000; // Update progress every second

    const interval = setInterval(() => {
      setSimulatedProgress((prev) => {
        let next = prev;

        if (currentStage === "loading") {
          // Loading: takes 3-5 seconds, advances to 22%
          if (prev < 22) {
            next = prev + 2;
          } else {
            setCurrentStage("analyzing");
          }
        } else if (currentStage === "analyzing") {
          // Analyzing: takes 5-7 seconds, advances to 30%
          if (prev < 30) {
            next = prev + 1.5;
          } else {
            setCurrentStage("separating");
          }
        } else if (currentStage === "separating") {
          // Separating: takes the bulk of the time, advances to 90%
          // Calculate step increment to reach 90% in estimatedDuration
          const remainingPct = 90 - prev;
          const remainingSteps = Math.max(10, estimatedDuration - 10); // estimate remaining seconds
          const increment = Math.max(0.1, remainingPct / remainingSteps);
          
          if (prev < 90) {
            next = Math.min(90, prev + increment);
          } else {
            setCurrentStage("finalizing");
          }
        } else if (currentStage === "finalizing") {
          // Finalizing: slowly approaches 99% until server responds and component unmounts
          if (prev < 99) {
            next = prev + 0.1;
          }
        }

        return parseFloat(next.toFixed(1));
      });
    }, stepTime);

    return () => clearInterval(interval);
  }, [currentStage, duration, isSixStems]);

  // UI Circular Progress calculations
  const radius = 70;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (simulatedProgress / 100) * circumference;

  // Step Status Mapping helper
  const getStepStatus = (stepName: Stage) => {
    const order: Stage[] = ["uploading", "loading", "analyzing", "separating", "finalizing"];
    const currentIndex = order.indexOf(currentStage);
    const stepIndex = order.indexOf(stepName);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  const steps = [
    { id: "uploading", label: "Uploading Audio File", desc: uploadProgress !== null && uploadProgress < 100 ? `Uploading: ${uploadProgress}%` : "File upload complete" },
    { id: "loading", label: "Loading Audio", desc: "Reading audio channels into memory..." },
    { id: "analyzing", label: "Analyzing Mix", desc: "Evaluating spectral properties & transients..." },
    { id: "separating", label: "Separating Instruments", desc: isSixStems ? "Running Demucs 6-Stem AI (Vocals, Drums, Bass, Guitar, Piano, Other)..." : "Separating Vocals & Instrumentals..." },
    { id: "finalizing", label: "Mixing & Preparing Stems", desc: "Wrapping up final mix channels and encoding files..." },
  ];

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center space-y-8 py-6 animate-in fade-in duration-500">
      
      {/* Circular Progress Section */}
      <div className="relative flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            stroke="rgba(255, 255, 255, 0.03)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
          <circle
            stroke="url(#progress-gradient)"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + " " + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-300 ease-out"
          />
          <defs>
            <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" /> {/* emerald-400 */}
              <stop offset="100%" stopColor="#059669" /> {/* emerald-600 */}
            </linearGradient>
          </defs>
        </svg>
        
        {/* Centered Percentage Label */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-4xl font-light text-white tracking-tighter font-mono">
            {Math.floor(simulatedProgress)}%
          </span>
          <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-500 mt-1">
            Progress
          </span>
        </div>
      </div>

      {/* Current Stage Headline */}
      <div className="text-center space-y-1.5">
        <h3 className="text-lg font-medium text-white tracking-tight">
          {currentStage === "uploading" && "Uploading Track"}
          {currentStage === "loading" && "Preparing Sound Wave"}
          {currentStage === "analyzing" && "Analyzing Acoustics"}
          {currentStage === "separating" && "Extracting Audio Stems"}
          {currentStage === "finalizing" && "Finalizing Mix"}
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto animate-pulse">
          {currentStage === "uploading" && "Sending your file to our server..."}
          {currentStage === "loading" && "Initializing AI audio workspace..."}
          {currentStage === "analyzing" && "Profiling frequency bands..."}
          {currentStage === "separating" && "Demucs AI is isolating sources (this takes a few minutes)..."}
          {currentStage === "finalizing" && "Encoding stems for playback. Almost done!"}
        </p>
      </div>

      {/* Progress Timeline List */}
      <div className="w-full space-y-3 pt-6 border-t border-white/5 max-w-md">
        {steps.map((step, idx) => {
          const status = getStepStatus(step.id as Stage);

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-4 py-2 transition-all duration-300",
                status === "active" ? "opacity-100" : "opacity-35"
              )}
            >
              {/* Step indicator (Checkmark / Spinner / Number) */}
              <div className="relative shrink-0">
                {status === "completed" ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                ) : status === "active" ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-zinc-900 border border-white/5 text-zinc-500 flex items-center justify-center text-xs font-semibold font-mono">
                    {idx + 1}
                  </div>
                )}
              </div>

              {/* Step details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-medium tracking-tight",
                      status === "active" ? "text-zinc-100 font-semibold" : "text-zinc-300"
                    )}
                  >
                    {step.label}
                  </span>
                  {status === "active" && (
                    <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
                      Running
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed truncate">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
