import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { coursesService } from "@/services/coursesService";
import { Loader2, X, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";
import { toast } from "sonner";

interface QuizPortalProps {
  lessonId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuizPortal({ lessonId, onClose, onSuccess }: QuizPortalProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  const { data: quiz, isLoading, error } = useQuery({
    queryKey: ["lesson-quiz", lessonId],
    queryFn: () => coursesService.getQuiz(lessonId),
  });

  const submitMutation = useMutation({
    mutationFn: (answersPayload: number[]) => coursesService.submitQuiz(quiz!._id, answersPayload),
    onSuccess: (res) => {
      setResult(res);
      if (res.passed) {
        toast.success(`Congratulations! You passed with a score of ${res.score}%`);
        onSuccess();
      } else {
        toast.error(`You scored ${res.score}%. A score of 70% is required to pass.`);
      }
    },
    onError: () => {
      toast.error("Failed to submit the quiz. Please try again.");
    },
  });

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-card border border-border p-8 rounded-xl shadow-lg flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading Quiz Questions...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-card border border-border p-6 rounded-xl shadow-lg w-full max-w-md relative">
          <button onClick={onClose} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
          <div className="text-center py-6">
            <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-bold text-foreground">No Quiz Available</h3>
            <p className="text-sm text-muted-foreground mt-1">This lesson does not have a quiz assessment associated with it.</p>
            <button onClick={onClose} className="mt-6 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/95 transition-all">
              Return to Lesson
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIdx];
  const totalQuestions = quiz.questions.length;
  const selectedOption = answers[currentIdx] ?? null;

  const handleSelectOption = (optIdx: number) => {
    const updated = [...answers];
    updated[currentIdx] = optIdx;
    setAnswers(updated);
  };

  const handleNext = () => {
    if (selectedOption === null) {
      toast.warning("Please select an answer before continuing.");
      return;
    }
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      submitMutation.mutate(answers);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleRetry = () => {
    setCurrentIdx(0);
    setAnswers([]);
    setResult(null);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border w-full max-w-xl rounded-xl shadow-lg relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
          <h3 className="font-bold text-foreground">Lesson Assessment</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {result ? (
          /* Results Panel */
          <div className="p-6 md:p-8 overflow-y-auto text-center flex-1 flex flex-col items-center justify-center gap-4">
            {result.passed ? (
              <CheckCircle className="h-16 w-16 text-emerald-500 mb-2" />
            ) : (
              <AlertTriangle className="h-16 w-16 text-rose-500 mb-2" />
            )}
            <h2 className="text-2xl font-extrabold text-foreground">
              {result.passed ? "Assessment Passed!" : "Assessment Failed"}
            </h2>
            <p className="text-lg text-foreground/80">
              You scored <span className="font-bold text-primary">{result.score}%</span>
            </p>
            <p className="text-sm text-muted-foreground max-w-sm">
              {result.passed
                ? "Excellent job! You have successfully passed the quiz and marked this lesson complete."
                : "You did not achieve the required 70% pass threshold. Please review the material and try again."}
            </p>
            <div className="flex gap-3 w-full max-w-xs mt-6">
              {result.passed ? (
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-primary text-white font-medium rounded-lg text-sm hover:bg-primary/95 transition-all shadow-sm"
                >
                  Continue Learning
                </button>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 border border-border text-foreground font-medium rounded-lg text-sm hover:bg-muted transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleRetry}
                    className="flex-1 py-2.5 bg-primary text-white font-medium rounded-lg text-sm hover:bg-primary/95 transition-all shadow-sm"
                  >
                    Retry Quiz
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Questions Form */
          <>
            {/* Progress indicator */}
            <div className="h-1.5 bg-muted w-full">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
              ></div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
                <span>QUESTION {currentIdx + 1} OF {totalQuestions}</span>
              </div>

              <h4 className="text-base md:text-lg font-bold text-foreground mb-6">
                {currentQuestion.question}
              </h4>

              <div className="flex flex-col gap-3">
                {currentQuestion.options.map((opt, oIdx) => (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(oIdx)}
                    className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${
                      selectedOption === oIdx
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted/40 text-foreground"
                    }`}
                  >
                    <span>{opt}</span>
                    <span className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center ${
                      selectedOption === oIdx ? "border-primary text-primary" : "border-border"
                    }`}>
                      {selectedOption === oIdx && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-border flex items-center justify-between bg-muted/10">
              <button
                onClick={handlePrev}
                disabled={currentIdx === 0}
                className="px-4 py-2 border border-border text-foreground font-medium rounded-lg text-xs hover:bg-muted transition-all disabled:opacity-30 disabled:pointer-events-none"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                disabled={submitMutation.isPending}
                className="px-5 py-2 bg-primary text-white font-medium rounded-lg text-xs hover:bg-primary/95 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitMutation.isPending ? (
                  <>
                    Submitting... <Loader2 className="h-3 w-3 animate-spin text-white" />
                  </>
                ) : currentIdx === totalQuestions - 1 ? (
                  "Submit Assessment"
                ) : (
                  "Next Question"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
