import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { coursesService } from "@/services/coursesService";
import { Loader2, X, AlertTriangle, CheckCircle, HelpCircle, ShieldAlert, Lock, RefreshCw, AlertOctagon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface QuizPortalProps {
  lessonId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuizPortal({ lessonId, onClose, onSuccess }: QuizPortalProps) {
  // Navigation & Answers
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  // Security States
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const portalRef = useRef<HTMLDivElement>(null);
  const examEndedRef = useRef(false);

  // Fetch Quiz
  const { data: quiz, isLoading, error } = useQuery({
    queryKey: ["lesson-quiz", lessonId],
    queryFn: () => coursesService.getQuiz(lessonId),
  });

  // Submit Mutation
  const submitMutation = useMutation({
    mutationFn: (answersPayload: number[]) => coursesService.submitQuiz(quiz!._id, answersPayload),
    onSuccess: (res) => {
      setResult(res);
      examEndedRef.current = true;
      exitFullscreen();
      if (res.passed) {
        toast.success(`Passed with a score of ${res.score}%!`);
        onSuccess();
      } else {
        toast.error(`Scored ${res.score}%. Passing score is 70%.`);
      }
    },
    onError: () => {
      toast.error("Failed to submit the quiz.");
    },
  });

  // Fullscreen helper functions
  const enterFullscreen = async () => {
    try {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      }
      setIsFullscreen(true);
    } catch (err) {
      console.error("Fullscreen request failed:", err);
      toast.error("Could not activate fullscreen. Please ensure permissions are granted.");
    }
  };

  const exitFullscreen = () => {
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      console.error("Fullscreen exit failed:", err);
    }
  };

  // Start Exam
  const handleStartExam = async () => {
    await enterFullscreen();
    setIsExamStarted(true);
    // Initialize answers array with -1 (unanswered)
    if (quiz?.questions) {
      setAnswers(new Array(quiz.questions.length).fill(-1));
    }
  };

  // Warning Trigger
  const triggerCheatingWarning = (reason: string) => {
    if (examEndedRef.current || isDisqualified) return;

    setWarningCount((prev) => {
      const nextCount = prev + 1;
      
      // Visual Alert
      toast.error(`SECURITY ALERT: ${reason}`, {
        duration: 5000,
        description: `This is warning ${nextCount}/2. Further violations will result in auto-disqualification.`,
      });

      if (nextCount >= 2) {
        handleDisqualification();
        return nextCount;
      }

      return nextCount;
    });
  };

  // Disqualification Action
  const handleDisqualification = () => {
    setIsDisqualified(true);
    examEndedRef.current = true;
    exitFullscreen();
    toast.error("DISQUALIFIED: You have been disqualified for violating exam regulations.", {
      duration: 10000,
    });

    // Auto-submit with failing blank answers (all -1)
    if (quiz?.questions) {
      const failedAnswers = new Array(quiz.questions.length).fill(-1);
      submitMutation.mutate(failedAnswers);
    }
  };

  // Cheating Prevention Listeners
  useEffect(() => {
    if (!isExamStarted || examEndedRef.current || isDisqualified) return;

    // 1. Tab switches (Visibility API)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerCheatingWarning("Tab switch detected!");
      }
    };

    // 2. Window Blur (losing focus to other apps)
    const handleWindowBlur = () => {
      triggerCheatingWarning("Window focus lost! Clicking outside the exam browser is prohibited.");
    };

    // 3. Fullscreen Exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        triggerCheatingWarning("Exit from fullscreen mode detected! Fullscreen is mandatory.");
      } else {
        setIsFullscreen(true);
      }
    };

    // 4. Keyboard Copy-Paste Block
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, F12
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && (e.key === "c" || e.key === "v" || e.key === "x" || e.key === "a")) {
        e.preventDefault();
        triggerCheatingWarning("Keyboard shortcut blocked!");
      }
      if (e.key === "F12") {
        e.preventDefault();
        triggerCheatingWarning("Developer tools shortcut blocked!");
      }
    };

    // 5. Right-click, Copy, Cut, Paste Block
    const preventDefaultAction = (e: Event) => {
      e.preventDefault();
      triggerCheatingWarning("Right-clicking, copying, cutting, or pasting text is strictly prohibited.");
    };

    // Attach Listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("keydown", handleKeyDown);

    const portalEl = portalRef.current;
    if (portalEl) {
      portalEl.addEventListener("contextmenu", preventDefaultAction);
      portalEl.addEventListener("copy", preventDefaultAction);
      portalEl.addEventListener("cut", preventDefaultAction);
      portalEl.addEventListener("paste", preventDefaultAction);
      portalEl.addEventListener("selectstart", preventDefaultAction);
    }

    return () => {
      // Detach Listeners
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("keydown", handleKeyDown);

      if (portalEl) {
        portalEl.removeEventListener("contextmenu", preventDefaultAction);
        portalEl.removeEventListener("copy", preventDefaultAction);
        portalEl.removeEventListener("cut", preventDefaultAction);
        portalEl.removeEventListener("paste", preventDefaultAction);
        portalEl.removeEventListener("selectstart", preventDefaultAction);
      }
      exitFullscreen();
    };
  }, [isExamStarted, isDisqualified]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl shadow-lg flex flex-col items-center gap-3 text-white">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-zinc-400">Loading Secure Exam Modules...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="fixed inset-0 bg-zinc-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-lg w-full max-w-md relative text-white text-center">
          <button onClick={onClose} className="absolute right-4 top-4 text-zinc-500 hover:text-white">
            <X className="h-5 w-5" />
          </button>
          <div className="py-6">
            <HelpCircle className="h-12 w-12 mx-auto text-zinc-500 mb-3" />
            <h3 className="text-lg font-bold">No Quiz Available</h3>
            <p className="text-sm text-zinc-400 mt-1">This lesson does not have a quiz assessment associated with it.</p>
            <Button onClick={onClose} className="mt-6 bg-primary hover:bg-primary/95 text-white">
              Return to Lesson
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIdx];
  const totalQuestions = quiz.questions.length;
  const selectedOption = answers[currentIdx] === -1 ? null : answers[currentIdx];

  const handleSelectOption = (optIdx: number) => {
    if (isDisqualified) return;
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

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 select-none" ref={portalRef}>
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] text-white">
        
        {/* SECURE TOP BAR */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-black tracking-wider text-red-500 flex items-center gap-1">
              <Lock className="h-3.5 w-3.5" /> SECURE EXAM ENVIRONMENT
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {isExamStarted && !result && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                <span className="text-[10px] font-bold text-red-400">
                  SECURITY WARNINGS: {warningCount}/1
                </span>
              </div>
            )}
            
            <button 
              onClick={() => {
                if (isExamStarted && !result && !isDisqualified) {
                  if (confirm("Are you sure you want to abandon the exam? This will auto-fail the assessment.")) {
                    handleDisqualification();
                  }
                } else {
                  onClose();
                }
              }} 
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 1. START/CONSENT SCREEN */}
        {!isExamStarted ? (
          <div className="p-6 md:p-8 flex flex-col items-center text-center justify-center gap-6">
            <div className="h-16 w-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <Lock className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight">Cheat-Restricted Exam Portal</h2>
              <p className="text-sm text-zinc-400 max-w-md mx-auto">
                You are about to begin a secure quiz assessment. Highly restricted anti-cheating regulations are active.
              </p>
            </div>

            {/* RULES GRID */}
            <div className="w-full max-w-md bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 text-left text-xs space-y-3.5">
              <h4 className="font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800 pb-2">
                <AlertOctagon className="h-4 w-4 text-red-400" /> Security Instructions
              </h4>
              <div className="space-y-2.5 text-zinc-400">
                <p className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span><strong>Mandatory Fullscreen:</strong> The portal will lock into fullscreen. Exiting fullscreen triggers a warning.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span><strong>No Tab/Window Switching:</strong> Changing tabs, opening new windows, or losing browser focus will increment warnings.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">•</span>
                  <span><strong>Blocked Actions:</strong> Text selection, right-clicking, copying, cutting, and pasting are strictly disabled.</span>
                </p>
                <p className="flex items-start gap-2 text-red-300">
                  <span className="text-red-400 font-bold">•</span>
                  <span><strong>Auto-Fail Disqualification:</strong> Reaching <strong>2 violations</strong> (exiting fullscreen or tab switches) triggers immediate exam termination.</span>
                </p>
              </div>
            </div>

            <div className="flex gap-3 w-full max-w-sm mt-2">
              <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
              <Button onClick={handleStartExam} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold gap-1.5 shadow-lg shadow-red-900/20">
                Consent & Lock Screen <Lock className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : result ? (
          /* 2. RESULTS PANEL */
          <div className="p-6 md:p-8 text-center flex-1 flex flex-col items-center justify-center gap-4">
            {isDisqualified ? (
              <>
                <ShieldAlert className="h-16 w-16 text-red-500 mb-2 animate-bounce" />
                <h2 className="text-2xl font-extrabold text-red-500">Exam Disqualified</h2>
                <Badge variant="destructive" className="px-3 py-1 font-bold text-xs">Security Violation</Badge>
                <p className="text-sm text-zinc-400 max-w-sm mt-2 leading-relaxed">
                  Your assessment was automatically terminated because you switched tabs, exited fullscreen, or attempted browser manipulation.
                </p>
              </>
            ) : result.passed ? (
              <>
                <CheckCircle className="h-16 w-16 text-emerald-500 mb-2" />
                <h2 className="text-2xl font-extrabold">Assessment Passed!</h2>
                <p className="text-lg text-zinc-300">
                  You scored <span className="font-bold text-primary">{result.score}%</span>
                </p>
                <p className="text-sm text-zinc-400 max-w-sm">
                  Excellent work! You have successfully passed the security assessment.
                </p>
              </>
            ) : (
              <>
                <AlertTriangle className="h-16 w-16 text-rose-500 mb-2" />
                <h2 className="text-2xl font-extrabold text-rose-500">Assessment Failed</h2>
                <p className="text-lg text-zinc-300">
                  You scored <span className="font-bold text-rose-400">{result.score}%</span>
                </p>
                <p className="text-sm text-zinc-400 max-w-sm">
                  You did not achieve the required 70% passing threshold. Please review the lessons and try again.
                </p>
              </>
            )}
            
            <div className="flex gap-3 w-full max-w-xs mt-6">
              {result.passed || isDisqualified ? (
                <Button onClick={onClose} className="w-full bg-primary hover:bg-primary/95">
                  Close Portal
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={onClose} className="flex-1">Close</Button>
                  <Button onClick={handleStartExam} className="flex-1 bg-primary hover:bg-primary/95">
                    Retry Quiz
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* 3. SECURE QUESTIONS FORM */
          <>
            {/* Progress indicator */}
            <div className="h-1 bg-zinc-800 w-full">
              <div
                className="h-full bg-red-600 transition-all duration-300"
                style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
              ></div>
            </div>

            {/* FULLSCREEN EXITED BANNER */}
            {!isFullscreen && (
              <div className="bg-red-600 text-white px-4 py-2.5 text-xs font-black text-center animate-pulse flex items-center justify-center gap-2 border-b border-zinc-800">
                <ShieldAlert className="h-4 w-4" />
                WARNING: YOU HAVE EXITED MANDATORY FULLSCREEN MODE! 
                <Button size="sm" variant="outline" className="bg-transparent hover:bg-white/10 text-white border-white ml-2 text-[10px] h-7" onClick={enterFullscreen}>
                  Re-enter Fullscreen
                </Button>
              </div>
            )}

            <div className="p-6 overflow-y-auto flex-1 select-none">
              <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-4 font-bold tracking-wider">
                <span>QUESTION {currentIdx + 1} OF {totalQuestions}</span>
                <span className="text-red-500">EXAM MODE ACTIVE</span>
              </div>

              <h4 className="text-base md:text-lg font-bold text-white mb-6">
                {currentQuestion.question}
              </h4>

              <div className="flex flex-col gap-3">
                {currentQuestion.options.map((opt: string, oIdx: number) => (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(oIdx)}
                    className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${
                      selectedOption === oIdx
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-zinc-850 hover:border-primary/50 hover:bg-zinc-900/30 text-zinc-300"
                    }`}
                  >
                    <span>{opt}</span>
                    <span className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                      selectedOption === oIdx ? "border-primary text-primary" : "border-zinc-700"
                    }`}>
                      {selectedOption === oIdx && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-zinc-800 flex items-center justify-between bg-zinc-900/10">
              <Button
                variant="ghost"
                onClick={handlePrev}
                disabled={currentIdx === 0}
                className="text-xs"
              >
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={submitMutation.isPending}
                className="bg-primary hover:bg-primary/95 text-white text-xs gap-1.5 font-bold shadow-lg"
              >
                {submitMutation.isPending ? (
                  <>
                    Submitting... <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  </>
                ) : currentIdx === totalQuestions - 1 ? (
                  "Submit Assessment"
                ) : (
                  "Next Question"
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
