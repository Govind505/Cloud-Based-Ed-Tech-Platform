import Header from "@/components/Header";
import { coursesService, Course } from "@/services/coursesService";
import { contentService } from "@/services/contentService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, BookOpen, Trash, Loader2, ChevronRight, Settings, PlusCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function InstructorDashboard() {
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  // Creation States
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [cTitle, setCTitle] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cThumb, setCThumb] = useState("");

  const [showCreateModule, setShowCreateModule] = useState(false);
  const [mTitle, setMTitle] = useState("");
  const [mDesc, setMDesc] = useState("");

  const [showCreateLesson, setShowCreateLesson] = useState<string | null>(null); // moduleId
  const [lTitle, setLTitle] = useState("");
  const [lType, setLType] = useState<"video" | "text">("video");
  const [lContent, setLContent] = useState("");
  const [lVideoId, setLVideoId] = useState("");

  // Quiz Builder States
  const [showCreateQuiz, setShowCreateQuiz] = useState<string | null>(null); // lessonId
  const [questions, setQuestions] = useState<{ question: string; options: string[]; correctAnswerIndex: number }[]>([
    { question: "", options: ["", "", "", ""], correctAnswerIndex: 0 }
  ]);

  // Queries
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["instructor-courses"],
    queryFn: coursesService.listCourses,
  });

  const { data: videos = [] } = useQuery({
    queryKey: ["instructor-videos"],
    queryFn: () => contentService.getVideos({ limit: 100 }),
  });

  // Mutations
  const createCourseMutation = useMutation({
    mutationFn: () => coursesService.createCourse(cTitle, cDesc, cThumb),
    onSuccess: () => {
      toast.success("Course created successfully!");
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      setCTitle(""); setCDesc(""); setCThumb("");
      setShowCreateCourse(false);
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: () => coursesService.addModule(selectedCourse!._id, mTitle, mDesc),
    onSuccess: (newModule) => {
      toast.success("Module added!");
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      // Update selected course context
      if (selectedCourse) {
        setSelectedCourse({
          ...selectedCourse,
          modules: [...selectedCourse.modules, { ...newModule, lessons: [] }]
        });
      }
      setMTitle(""); setMDesc("");
      setShowCreateModule(false);
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: (moduleId: string) => coursesService.addLesson(moduleId, {
      title: lTitle,
      type: lType,
      content: lType === "text" ? lContent : undefined,
      videoId: lType === "video" ? lVideoId : undefined,
    }),
    onSuccess: () => {
      toast.success("Lesson added successfully!");
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      // Reload current selected course detail
      if (selectedCourse) {
        coursesService.getCourseDetail(selectedCourse._id).then(setSelectedCourse);
      }
      setLTitle(""); setLContent(""); setLVideoId("");
      setShowCreateLesson(null);
    },
  });

  const createQuizMutation = useMutation({
    mutationFn: (lessonId: string) => coursesService.createQuiz(lessonId, questions),
    onSuccess: () => {
      toast.success("Quiz assessment generated!");
      setShowCreateQuiz(null);
      setQuestions([{ question: "", options: ["", "", "", ""], correctAnswerIndex: 0 }]);
    },
    onError: () => {
      toast.error("Failed to build quiz.");
    }
  });

  const handleAddQuestion = () => {
    setQuestions([...questions, { question: "", options: ["", "", "", ""], correctAnswerIndex: 0 }]);
  };

  const handleQuestionChange = (qIdx: number, val: string) => {
    const updated = [...questions];
    updated[qIdx].question = val;
    setQuestions(updated);
  };

  const handleOptionChange = (qIdx: number, oIdx: number, val: string) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = val;
    setQuestions(updated);
  };

  const handleCorrectAnswerChange = (qIdx: number, val: number) => {
    const updated = [...questions];
    updated[qIdx].correctAnswerIndex = val;
    setQuestions(updated);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
          
          {/* ── Left column (Course List) ── */}
          <div className="md:w-1/3 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" /> Instructor Portal
              </h2>
              <button
                onClick={() => setShowCreateCourse(true)}
                className="inline-flex items-center px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-sm"
              >
                New Course <Plus className="ml-1 h-3.5 w-3.5" />
              </button>
            </div>

            {/* Create Course Form overlay */}
            {showCreateCourse && (
              <div className="bg-card border border-border p-5 rounded-xl shadow-sm">
                <h3 className="font-bold text-sm mb-4 text-foreground">Create Course Profile</h3>
                <div className="flex flex-col gap-3.5 text-left">
                  <div>
                    <label className="text-xs text-muted-foreground font-semibold">Course Title</label>
                    <input
                      type="text"
                      className="w-full mt-1 px-3 py-2 bg-background border border-border text-foreground rounded-lg text-sm focus:outline-none"
                      placeholder="e.g. Master React Hooks"
                      value={cTitle}
                      onChange={e => setCTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-semibold">Course Description</label>
                    <textarea
                      className="w-full mt-1 px-3 py-2 bg-background border border-border text-foreground rounded-lg text-sm resize-none h-20 focus:outline-none"
                      placeholder="Describe what students will learn..."
                      value={cDesc}
                      onChange={e => setCDesc(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground font-semibold">Thumbnail URL (Optional)</label>
                    <input
                      type="text"
                      className="w-full mt-1 px-3 py-2 bg-background border border-border text-foreground rounded-lg text-sm focus:outline-none"
                      placeholder="https://example.com/thumb.jpg"
                      value={cThumb}
                      onChange={e => setCThumb(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 justify-end mt-2">
                    <button onClick={() => setShowCreateCourse(false)} className="px-3.5 py-1.5 border border-border text-xs rounded-lg hover:bg-muted">Cancel</button>
                    <button onClick={() => createCourseMutation.mutate()} className="px-3.5 py-1.5 bg-primary text-white text-xs rounded-lg hover:bg-primary/95">Save</button>
                  </div>
                </div>
              </div>
            )}

            {/* Courses Selector List */}
            {coursesLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : courses.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-8">No courses created yet.</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {courses.map(c => (
                  <button
                    key={c._id}
                    onClick={() => {
                      coursesService.getCourseDetail(c._id).then(setSelectedCourse);
                    }}
                    className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all ${
                      selectedCourse?._id === c._id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:bg-muted/40 text-foreground"
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-sm truncate max-w-[200px]">{c.title}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{c.modules?.length || 0} Modules</p>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right column (Curriculum constructor) ── */}
          <div className="flex-1">
            {selectedCourse ? (
              <div className="flex flex-col gap-6">
                {/* Course Header Banner */}
                <div className="bg-card border border-border p-6 rounded-xl shadow-sm text-left">
                  <h3 className="text-2xl font-extrabold text-foreground">{selectedCourse.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{selectedCourse.description || "No description provided."}</p>
                  
                  <div className="mt-6 pt-4 border-t border-border flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Course ID: <span className="font-mono text-foreground">{selectedCourse._id}</span></span>
                    <button
                      onClick={() => setShowCreateModule(true)}
                      className="inline-flex items-center px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-sm"
                    >
                      Add Module <PlusCircle className="ml-1.5 h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Create Module form overlay */}
                {showCreateModule && (
                  <div className="bg-card border border-border p-5 rounded-xl text-left">
                    <h4 className="font-bold text-sm mb-4">Add Curriculum Module</h4>
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground font-semibold">Module Title</label>
                        <input
                          type="text"
                          className="w-full mt-1 px-3 py-2 bg-background border border-border text-foreground rounded-lg text-sm focus:outline-none"
                          placeholder="e.g. Chapter 1: Introduction to Frameworks"
                          value={mTitle}
                          onChange={e => setMTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground font-semibold">Description (Optional)</label>
                        <input
                          type="text"
                          className="w-full mt-1 px-3 py-2 bg-background border border-border text-foreground rounded-lg text-sm focus:outline-none"
                          placeholder="Brief summary of lessons in this chapter..."
                          value={mDesc}
                          onChange={e => setMDesc(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2 justify-end mt-2">
                        <button onClick={() => setShowCreateModule(false)} className="px-3.5 py-1.5 border border-border text-xs rounded-lg hover:bg-muted">Cancel</button>
                        <button onClick={() => createModuleMutation.mutate()} className="px-3.5 py-1.5 bg-primary text-white text-xs rounded-lg hover:bg-primary/95">Save Module</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modules syllabus list */}
                <div className="flex flex-col gap-4 text-left">
                  {selectedCourse.modules?.length === 0 ? (
                    <div className="text-center py-10 bg-card border border-border rounded-xl text-muted-foreground italic">
                      Curriculum outline is empty. Click "Add Module" to get started.
                    </div>
                  ) : (
                    selectedCourse.modules.map((mod, modIdx) => (
                      <div key={mod._id} className="bg-card border border-border rounded-xl p-5 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h4 className="font-bold text-base text-foreground">Module {modIdx + 1}: {mod.title}</h4>
                            {mod.description && <p className="text-xs text-muted-foreground mt-0.5">{mod.description}</p>}
                          </div>
                          <button
                            onClick={() => setShowCreateLesson(mod._id)}
                            className="text-xs text-primary hover:underline font-semibold"
                          >
                            + Add Lesson
                          </button>
                        </div>

                        {/* Create Lesson form panel */}
                        {showCreateLesson === mod._id && (
                          <div className="mb-4 p-4 border border-primary/20 bg-primary/5 rounded-xl flex flex-col gap-3">
                            <h5 className="font-bold text-xs text-primary">New Lesson Creator</h5>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="col-span-2">
                                <label className="text-[10px] text-muted-foreground font-semibold">Lesson Title</label>
                                <input
                                  type="text"
                                  className="w-full mt-1 px-3 py-2 bg-background border border-border text-foreground rounded-lg text-xs focus:outline-none"
                                  placeholder="e.g. Understanding JSX"
                                  value={lTitle}
                                  onChange={e => setLTitle(e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground font-semibold">Lesson Type</label>
                                <select
                                  value={lType}
                                  onChange={e => setLType(e.target.value as any)}
                                  className="w-full mt-1 px-3 py-2 bg-background border border-border text-foreground rounded-lg text-xs focus:outline-none"
                                >
                                  <option value="video">Video Lesson</option>
                                  <option value="text">Text / Markdown Lesson</option>
                                </select>
                              </div>
                              {lType === "video" ? (
                                <div>
                                  <label className="text-[10px] text-muted-foreground font-semibold">Select Transcoded Video</label>
                                  <select
                                    value={lVideoId}
                                    onChange={e => setLVideoId(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 bg-background border border-border text-foreground rounded-lg text-xs focus:outline-none"
                                  >
                                    <option value="">-- Choose Video --</option>
                                    {videos.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}
                                  </select>
                                </div>
                              ) : (
                                <div className="col-span-2">
                                  <label className="text-[10px] text-muted-foreground font-semibold">Markdown Lesson Content</label>
                                  <textarea
                                    className="w-full mt-1 px-3 py-2 bg-background border border-border text-foreground rounded-lg text-xs resize-none h-24 focus:outline-none font-mono"
                                    placeholder="Write markdown text or study guides..."
                                    value={lContent}
                                    onChange={e => setLContent(e.target.value)}
                                  />
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 justify-end mt-2">
                              <button onClick={() => setShowCreateLesson(null)} className="px-3 py-1 border border-border text-[10px] rounded-lg hover:bg-muted">Cancel</button>
                              <button onClick={() => createLessonMutation.mutate(mod._id)} className="px-3 py-1 bg-primary text-white text-[10px] rounded-lg hover:bg-primary/95">Save Lesson</button>
                            </div>
                          </div>
                        )}

                        {/* Module lessons list */}
                        <div className="border-t border-border/60 pt-3 flex flex-col gap-2">
                          {mod.lessons?.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">No lessons added to this chapter yet.</p>
                          ) : (
                            mod.lessons.map((lesson, lessonIdx) => (
                              <div key={lesson._id} className="p-3 bg-muted/30 rounded-lg flex items-center justify-between text-xs border border-border/40">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-muted-foreground">Lesson {lessonIdx + 1}:</span>
                                  <span className="text-foreground font-medium">{lesson.title}</span>
                                  <span className="text-[8px] bg-muted border border-border px-1.5 py-0.5 rounded uppercase font-semibold">
                                    {lesson.type}
                                  </span>
                                </div>
                                <button
                                  onClick={() => setShowCreateQuiz(lesson._id)}
                                  className="text-[10px] text-primary hover:underline font-bold"
                                >
                                  + Create Quiz
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 bg-card border border-border rounded-xl text-center p-8">
                <BookOpen className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-bold text-foreground">No Course Selected</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Select a course from the left sidebar panel to edit its modules, compile syllabus lessons, and create quiz evaluations.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Create Quiz Modal Overlay */}
      {showCreateQuiz && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-xl rounded-xl shadow-lg relative overflow-hidden flex flex-col max-h-[85vh] text-left">
            <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
              <h3 className="font-bold text-foreground">Create Lesson Quiz Assessment</h3>
              <button onClick={() => setShowCreateQuiz(null)} className="text-muted-foreground hover:text-foreground">X</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="p-4 bg-muted/20 border border-border rounded-xl flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold text-xs text-secondary">Question {qIdx + 1}</h5>
                    {questions.length > 1 && (
                      <button
                        onClick={() => setQuestions(questions.filter((_, i) => i !== qIdx))}
                        className="text-[10px] text-rose-500 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-[10px] text-muted-foreground font-semibold">Question Text</label>
                    <input
                      type="text"
                      className="w-full mt-1 px-3 py-2 bg-background border border-border text-foreground rounded-lg text-xs focus:outline-none"
                      placeholder="e.g. What hooks is used for side-effects?"
                      value={q.question}
                      onChange={e => handleQuestionChange(qIdx, e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx}>
                        <label className="text-[9px] text-muted-foreground font-semibold">Option {oIdx + 1}</label>
                        <input
                          type="text"
                          className="w-full mt-0.5 px-3 py-1.5 bg-background border border-border text-foreground rounded-lg text-xs focus:outline-none"
                          placeholder={`Option ${oIdx + 1}`}
                          value={opt}
                          onChange={e => handleOptionChange(qIdx, oIdx, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="text-[10px] text-muted-foreground font-semibold">Correct Answer Option</label>
                    <select
                      value={q.correctAnswerIndex}
                      onChange={e => handleCorrectAnswerChange(qIdx, parseInt(e.target.value))}
                      className="w-full mt-1 px-3 py-2 bg-background border border-border text-foreground rounded-lg text-xs focus:outline-none"
                    >
                      <option value={0}>Option 1</option>
                      <option value={1}>Option 2</option>
                      <option value={2}>Option 3</option>
                      <option value={3}>Option 4</option>
                    </select>
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddQuestion}
                className="w-full py-2.5 border border-dashed border-primary/30 text-primary font-bold text-xs rounded-xl hover:bg-primary/5 transition-all text-center"
              >
                + Add Another Question
              </button>
            </div>

            <div className="p-4 border-t border-border bg-muted/10 flex justify-end gap-2">
              <button onClick={() => setShowCreateQuiz(null)} className="px-4 py-2 border border-border text-xs rounded-lg hover:bg-muted font-medium">Cancel</button>
              <button
                onClick={() => {
                  const invalid = questions.some(q => !q.question.trim() || q.options.some(o => !o.trim()));
                  if (invalid) {
                    toast.error("Please fill out all questions and option fields.");
                    return;
                  }
                  createQuizMutation.mutate(showCreateQuiz!);
                }}
                className="px-4 py-2 bg-primary text-white text-xs rounded-lg hover:bg-primary/95 font-medium shadow-sm"
              >
                Save Quiz Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
