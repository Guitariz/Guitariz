import { useState } from "react";
import { LESSONS, QUIZ_QUESTIONS } from "./theoryData";
import { ChevronLeft, ChevronRight, CheckCircle, HelpCircle, Trophy, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LearnModeBannerProps {
  currentLessonIndex: number;
  onSelectLesson: (index: number) => void;
  selectedKey: string | null;
  onSelectKeyNote: (note: string) => void;
}

export const LearnModeBanner = ({
  currentLessonIndex,
  onSelectLesson,
  selectedKey,
  onSelectKeyNote,
}: LearnModeBannerProps) => {
  const [activeQuizIndex, setActiveQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showQuizResult, setShowQuizResult] = useState(false);

  const lesson = LESSONS[currentLessonIndex] || LESSONS[0];
  const quiz = QUIZ_QUESTIONS[activeQuizIndex];

  const handleOptionSelect = (optionIdx: number) => {
    setSelectedOption(optionIdx);
    setShowQuizResult(true);
  };

  const handleNextQuiz = () => {
    setSelectedOption(null);
    setShowQuizResult(false);
    setActiveQuizIndex((prev) => (prev + 1) % QUIZ_QUESTIONS.length);
  };

  return (
    <div className="w-full space-y-4 mb-6">
      {/* Timeline Navigation Bar */}
      <div className="p-4 rounded-2xl bg-card/60 border border-white/10 shadow-lg backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            disabled={currentLessonIndex === 0}
            onClick={() => onSelectLesson(Math.max(0, currentLessonIndex - 1))}
            className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">
              Lesson {lesson.id} / {LESSONS.length}
            </span>
            <span className="text-muted-foreground">•</span>
            <h3 className="text-sm font-semibold text-foreground">{lesson.title}</h3>
          </div>

          <button
            disabled={currentLessonIndex === LESSONS.length - 1}
            onClick={() => onSelectLesson(Math.min(LESSONS.length - 1, currentLessonIndex + 1))}
            className="p-1.5 rounded-lg border border-white/10 hover:bg-white/10 text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Task Card Prompt */}
        <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl">
          <Sparkles className="w-4 h-4 text-primary shrink-0 animate-pulse" />
          <span className="text-xs font-medium text-foreground">{lesson.task}</span>
        </div>
      </div>

      {/* Mini Playground / Challenge Card */}
      <div className="p-5 rounded-2xl bg-card/40 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
            <Trophy className="w-4 h-4" />
            <span>Mini Playground Challenge</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Quiz {activeQuizIndex + 1} of {QUIZ_QUESTIONS.length}</span>
        </div>

        <div className="text-xs font-medium text-foreground">{quiz.question}</div>

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
                  "p-2.5 rounded-xl border text-xs font-medium text-left transition-all",
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
            <span className={cn("font-semibold", selectedOption === quiz.correctIndex ? "text-emerald-400" : "text-red-400")}>
              {selectedOption === quiz.correctIndex ? "✓ Correct! " : "✗ Not quite. "} {quiz.explanation}
            </span>
            <button
              onClick={handleNextQuiz}
              className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-[11px] font-semibold hover:bg-primary/90"
            >
              Next Challenge →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
