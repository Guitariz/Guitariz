import { useState, useEffect, useCallback } from "react";
import { LESSONS, QUIZ_QUESTIONS } from "./theoryData";
import { playNote, playScale } from "./audioSynth";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Play,
  Pause,
  CheckCircle2,
  Trophy,
  RotateCcw,
  BookOpen,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonControllerProps {
  selectedKey: string | null;
  onSelectKeyNote: (note: string) => void;
  onSetHighlightKey: (note: string | null, hintText: string | null) => void;
}

export const LessonController = ({
  selectedKey,
  onSelectKeyNote,
  onSetHighlightKey,
}: LessonControllerProps) => {
  const [activeTab, setActiveTab] = useState<"lessons" | "quiz">("lessons");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Quiz State
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const lesson = LESSONS[currentStepIndex] || LESSONS[0];
  const quiz = QUIZ_QUESTIONS[activeQuizIndex];

  // Highlight target key on wheel when step changes
  useEffect(() => {
    if (activeTab === "lessons" && !isCompleted) {
      if (lesson.targetKey) {
        onSetHighlightKey(lesson.targetKey, `Click [ ${lesson.targetKey} ]`);
      } else {
        onSetHighlightKey(null, null);
      }
    } else {
      onSetHighlightKey(null, null);
    }
  }, [currentStepIndex, activeTab, isCompleted, lesson.targetKey, onSetHighlightKey]);

  // Handle user key clicks for automated step advancement
  useEffect(() => {
    if (activeTab !== "lessons" || isCompleted) return;

    const target = lesson.targetKey;
    if (target && selectedKey === target) {
      // User clicked correct target note!
      setSuccessToast(`✓ Excellent! ${lesson.title} task completed.`);
      playNote(selectedKey);

      const timer = setTimeout(() => {
        setSuccessToast(null);
        if (currentStepIndex < LESSONS.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        } else {
          setIsCompleted(true);
          setIsAutoPlaying(false);
        }
      }, 1400);

      return () => clearTimeout(timer);
    }
  }, [selectedKey, currentStepIndex, activeTab, isCompleted, lesson.targetKey, lesson.title]);

  // Automated Auto-Play step loop
  useEffect(() => {
    if (!isAutoPlaying || isCompleted || activeTab !== "lessons") return;

    const target = lesson.targetKey || "C";
    onSelectKeyNote(target);
    playNote(target);

    const autoTimer = setTimeout(() => {
      if (currentStepIndex < LESSONS.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
      } else {
        setIsAutoPlaying(false);
        setIsCompleted(true);
      }
    }, 2800);

    return () => clearTimeout(autoTimer);
  }, [isAutoPlaying, currentStepIndex, isCompleted, activeTab, lesson.targetKey, onSelectKeyNote]);

  const handleNextStep = () => {
    if (currentStepIndex < LESSONS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrevStep = () => {
    setIsCompleted(false);
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleResetLessons = () => {
    setIsCompleted(false);
    setIsAutoPlaying(false);
    setCurrentStepIndex(0);
    onSelectKeyNote("C");
  };

  const handleOptionSelect = (optionIdx: number) => {
    setSelectedOption(optionIdx);
    setShowQuizResult(true);
    if (optionIdx === quiz.correctIndex) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuiz = () => {
    setSelectedOption(null);
    setShowQuizResult(false);
    setActiveQuizIndex((prev) => (prev + 1) % QUIZ_QUESTIONS.length);
  };

  return (
    <div className="w-full space-y-3 mb-4">
      {/* Top Controller Header Bar */}
      <div className="p-4 rounded-2xl bg-card/70 border border-white/10 shadow-lg backdrop-blur-md space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Sub Tabs: Guided Lessons vs Quiz */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab("lessons")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all",
                activeTab === "lessons"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Guided Lessons ({LESSONS.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("quiz")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all",
                activeTab === "quiz"
                  ? "bg-primary text-primary-foreground shadow"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Mini Quiz ({QUIZ_QUESTIONS.length})</span>
            </button>
          </div>

          {/* Auto Play & Reset Actions */}
          {activeTab === "lessons" && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow active:scale-95 border",
                  isAutoPlaying
                    ? "bg-amber-500 text-black border-amber-400 animate-pulse"
                    : "bg-primary/20 text-primary border-primary/40 hover:bg-primary/30"
                )}
              >
                {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isAutoPlaying ? "Pause Auto-Play" : "▶ Auto-Play Tour"}</span>
              </button>

              <button
                onClick={handleResetLessons}
                className="p-1.5 rounded-xl border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                title="Restart Lessons"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* 1. Guided Lessons View */}
        {activeTab === "lessons" && (
          <div className="space-y-3 pt-1">
            {!isCompleted ? (
              <>
                {/* Step Progress & Title */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentStepIndex === 0}
                      onClick={handlePrevStep}
                      className="p-1 rounded-lg border border-white/10 hover:bg-white/10 text-foreground disabled:opacity-30 disabled:pointer-events-none"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      Step {lesson.id} / {LESSONS.length}: {lesson.title}
                    </span>
                    <button
                      onClick={handleNextStep}
                      className="p-1 rounded-lg border border-white/10 hover:bg-white/10 text-foreground"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-[10px] text-muted-foreground">
                    {Math.round(((currentStepIndex + 1) / LESSONS.length) * 100)}% Complete
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${((currentStepIndex + 1) / LESSONS.length) * 100}%` }}
                  />
                </div>

                {/* Current Interactive Task Box */}
                <div className="p-3.5 rounded-xl bg-card border border-primary/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary shrink-0 animate-pulse" />
                      <span>{lesson.task}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed pl-6">
                      {lesson.explanation}
                    </p>
                  </div>

                  {lesson.targetKey && (
                    <button
                      onClick={() => onSelectKeyNote(lesson.targetKey!)}
                      className="px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/40 text-primary text-xs font-bold hover:bg-primary/30 transition-all shrink-0 self-end sm:self-center"
                    >
                      Click [ {lesson.targetKey} ]
                    </button>
                  )}
                </div>

                {/* Instant Success Toast Callout */}
                {successToast && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-xs font-medium flex items-center gap-2 animate-in fade-in zoom-in-95">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{successToast}</span>
                  </div>
                )}
              </>
            ) : (
              /* Tutorial Completion Celebration Screen */
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Tutorial Completed!</span>
                  </div>
                  <button
                    onClick={handleResetLessons}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-100 font-semibold"
                  >
                    Replay Tour
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-medium pt-1">
                  <div className="p-2 rounded-lg bg-black/40 border border-emerald-500/20">✔ Fifths (+5th)</div>
                  <div className="p-2 rounded-lg bg-black/40 border border-emerald-500/20">✔ Fourths (+4th)</div>
                  <div className="p-2 rounded-lg bg-black/40 border border-emerald-500/20">✔ Relative Minor</div>
                  <div className="p-2 rounded-lg bg-black/40 border border-emerald-500/20">✔ Key Signatures</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Mini Quiz Challenge View */}
        {activeTab === "quiz" && (
          <div className="space-y-3 pt-1 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-primary uppercase tracking-widest">
                Question {activeQuizIndex + 1} of {QUIZ_QUESTIONS.length}
              </span>
              <span className="text-muted-foreground font-mono">Score: {quizScore}</span>
            </div>

            <div className="text-sm font-semibold text-foreground">{quiz.question}</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quiz.options.map((opt, idx) => {
                const isCorrect = idx === quiz.correctIndex;
                const isSelected = selectedOption === idx;

                return (
                  <button
                    key={idx}
                    disabled={showQuizResult}
                    onClick={() => handleOptionSelect(idx)}
                    className={cn(
                      "p-3 rounded-xl border text-xs font-medium text-left transition-all",
                      showQuizResult && isCorrect
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-200"
                        : showQuizResult && isSelected && !isCorrect
                        ? "bg-red-500/20 border-red-500 text-red-200"
                        : "bg-card border-white/10 hover:border-primary/50 text-foreground"
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {showQuizResult && (
              <div className="pt-2 flex items-center justify-between text-xs animate-in fade-in">
                <span
                  className={cn(
                    "font-semibold",
                    selectedOption === quiz.correctIndex ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {selectedOption === quiz.correctIndex ? "✓ Correct! " : "✗ Not quite. "}
                  {quiz.explanation}
                </span>
                <button
                  onClick={handleNextQuiz}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
                >
                  Next Question →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
