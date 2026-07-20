import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Hls from "hls.js";
import {
  ArrowLeft, PlayCircle, Clock, BookOpen, Share2,
  Loader2, ThumbsUp, CheckCircle, ChevronRight, StickyNote,
  MessageSquare, Star, Heart, Send, Lock, FileText, CheckCircle2 as CheckedIcon, HelpCircle, GraduationCap, Video
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { coursesService, Course, Lesson } from "@/services/coursesService";
import { API_BASE_URL } from "@/services/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import QuizPortal from "@/components/QuizPortal";
import { Skeleton } from "@/components/ui/skeleton";

export default function Watch() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);

  // States
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string>();
  const [showQuiz, setShowQuiz] = useState(false);
  const [liked, setLiked] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<{ time?: string; text: string }[]>([]);
  const [question, setQuestion] = useState("");
  const [localQna, setLocalQna] = useState<{ q: string; a: string; votes: number }[]>([]);

  // Fetch Course details (curriculum)
  const { data: course, isLoading: isCourseLoading, error: courseError } = useQuery({
    queryKey: ["course-player", courseId],
    queryFn: () => coursesService.getCourseDetail(courseId!),
    enabled: !!courseId,
  });

  // Fetch Student Progress
  const { data: progress, isLoading: isProgressLoading } = useQuery({
    queryKey: ["course-progress", courseId],
    queryFn: () => coursesService.getProgress(courseId!),
    enabled: !!courseId,
  });

  // Check if user is enrolled
  useEffect(() => {
    if (course && progress) {
      // Set first lesson as default if none selected
      if (!activeLesson && course.modules.length > 0) {
        const firstModule = course.modules[0];
        if (firstModule.lessons.length > 0) {
          setActiveLesson(firstModule.lessons[0]);
        }
      }
    }
  }, [course, progress, activeLesson]);

  // Complete Lesson mutation
  const completeMutation = useMutation({
    mutationFn: (lessonId: string) => coursesService.completeLesson(lessonId),
    onSuccess: () => {
      toast.success("Lesson marked as completed!");
      queryClient.invalidateQueries({ queryKey: ["course-progress", courseId] });
      loadNextLesson();
    },
    onError: () => {
      toast.error("Failed to update progress.");
    },
  });

  // Load next lesson automatically
  const loadNextLesson = () => {
    if (!course || !activeLesson) return;
    let found = false;
    for (let m = 0; m < course.modules.length; m++) {
      const mod = course.modules[m];
      for (let l = 0; l < mod.lessons.length; l++) {
        const les = mod.lessons[l];
        if (found) {
          setActiveLesson(les);
          return;
        }
        if (les._id === activeLesson._id) {
          found = true;
        }
      }
    }
  };

  // Video Streaming Setup
  const hlsUrl = activeLesson?.type === "video" && activeLesson.videoId
    ? `${API_BASE_URL}/streaming/${activeLesson.videoId}/manifest.m3u8`
    : undefined;
  
  const fallbackVideoUrl = activeLesson?.videoId
    ? "https://www.w3schools.com/html/mov_bbb.mp4"
    : undefined;

  useEffect(() => {
    const player = videoRef.current;
    if (!player || !hlsUrl) return;

    const token = localStorage.getItem("accessToken");

    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr) => {
          if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          }
        },
      });

      hls.loadSource(hlsUrl);
      hls.attachMedia(player);
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal && fallbackVideoUrl) {
          hls.destroy();
          setPlaybackUrl(fallbackVideoUrl);
        }
      });

      return () => hls.destroy();
    }

    if (player.canPlayType("application/vnd.apple.mpegurl")) {
      setPlaybackUrl(hlsUrl);
      return;
    }

    setPlaybackUrl(fallbackVideoUrl);
  }, [hlsUrl, fallbackVideoUrl, activeLesson]);

  if (isCourseLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <Header />
        <main className="pt-20 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto pb-16">
          <div className="mb-6 flex gap-2">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="h-4 w-40 rounded" />
          </div>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-3/4 flex flex-col gap-6">
              <Skeleton className="w-full aspect-video rounded-2xl animate-pulse" />
              <div className="flex justify-between items-center pb-6 border-b border-zinc-800">
                <div className="space-y-2">
                  <Skeleton className="h-7 w-64 rounded animate-pulse" />
                  <Skeleton className="h-4 w-32 rounded animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-28 rounded-lg animate-pulse" />
                  <Skeleton className="h-10 w-28 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
            <div className="lg:w-1/4 space-y-5">
              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5 space-y-3">
                <Skeleton className="h-5 w-1/2 rounded animate-pulse" />
                <Skeleton className="h-3 w-1/3 rounded animate-pulse" />
                <Skeleton className="h-2 w-full rounded animate-pulse" />
              </div>
              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-4 space-y-4">
                <Skeleton className="h-5 w-3/4 rounded animate-pulse" />
                <div className="space-y-2.5">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-8 w-full rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
        <GraduationCap className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">Course Not Found</h2>
        <button onClick={() => navigate("/lms")} className="mt-4 text-primary hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Library
        </button>
      </div>
    );
  }

  const completedLessons = progress?.completedLessons || [];
  const progressPercent = progress?.progressPercent || 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />

      <main className="pt-20 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto pb-16">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
          <button onClick={() => navigate("/lms")} className="hover:text-primary flex items-center gap-1 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to library
          </button>
          <ChevronRight className="h-3 w-3" />
          <span className="text-zinc-400">{course.title}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-white font-medium truncate max-w-[200px]">{activeLesson?.title || "Loading Lesson..."}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Main View Column ── */}
          <div className="lg:w-3/4 flex flex-col gap-6">
            {activeLesson ? (
              <>
                {/* Content Pane */}
                <motion.div
                  key={activeLesson._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center"
                >
                  {activeLesson.type === "video" ? (
                    <video
                      ref={videoRef}
                      controls
                      autoPlay
                      className="w-full h-full object-contain bg-black"
                      src={playbackUrl || fallbackVideoUrl}
                    />
                  ) : activeLesson.type === "live" ? (
                    <div className="w-full h-full p-8 md:p-12 overflow-y-auto bg-zinc-900/40 text-center flex flex-col items-center justify-center gap-6 text-zinc-200">
                      <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <Video className="h-8 w-8 animate-pulse" />
                      </div>
                      
                      <div className="space-y-2">
                        <h2 className="text-2xl md:text-3xl font-black text-white">{activeLesson.title}</h2>
                        <p className="text-sm text-zinc-400 font-bold uppercase tracking-wider">Live Virtual Classroom</p>
                      </div>

                      <div className="w-full max-w-sm bg-zinc-950/60 border border-zinc-850 rounded-xl p-5 space-y-4 text-left">
                        <div className="flex justify-between border-b border-zinc-900 pb-2">
                          <span className="text-zinc-500 text-xs">Start Time:</span>
                          <span className="text-zinc-200 text-xs font-bold">
                            {activeLesson.startTime ? new Date(activeLesson.startTime).toLocaleString() : "TBD"}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-900 pb-2">
                          <span className="text-zinc-500 text-xs">Duration:</span>
                          <span className="text-zinc-200 text-xs font-bold">{activeLesson.duration || 60} Minutes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500 text-xs">Class Status:</span>
                          <span className="text-xs font-black uppercase flex items-center gap-1">
                            {activeLesson.meetingStatus === "scheduled" && (
                              <span className="text-amber-400">● Scheduled</span>
                            )}
                            {activeLesson.meetingStatus === "active" && (
                              <span className="text-emerald-400 animate-pulse">● Active Now</span>
                            )}
                            {activeLesson.meetingStatus === "completed" && (
                              <span className="text-zinc-500">● Finished</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {activeLesson.meetingStatus === "scheduled" && (
                        <div className="text-sm text-zinc-500 italic mt-2">
                          The live classroom hasn't started yet. Please wait for the instructor to launch the session.
                        </div>
                      )}

                      {activeLesson.meetingStatus === "active" && (
                        <button
                          onClick={() => navigate(`/live/${activeLesson.meetingId || activeLesson._id}`)}
                          className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-emerald-900/20 animate-pulse"
                        >
                          Join Virtual Classroom
                        </button>
                      )}

                      {activeLesson.meetingStatus === "completed" && (
                        <div className="text-sm text-zinc-500 mt-2">
                          This live session has concluded. Check the student discussion board for lecture notes or class slides.
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Reading Pane */
                    <div className="w-full h-full p-8 md:p-12 overflow-y-auto bg-zinc-900/40 text-left flex flex-col gap-4 text-zinc-200">
                      <h2 className="text-2xl md:text-3xl font-extrabold text-white border-b border-zinc-800 pb-3">
                        {activeLesson.title}
                      </h2>
                      <div className="prose prose-invert max-w-none text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                        {activeLesson.content || "This reading lesson has no content written yet."}
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Lesson Actions */}
                <div className="flex items-center justify-between flex-wrap gap-4 border-b border-zinc-800 pb-6">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white">{activeLesson.title}</h1>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                      <span className="capitalize px-2 py-0.5 rounded bg-zinc-800 font-semibold">{activeLesson.type}</span>
                      {activeLesson.duration ? (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {Math.round(activeLesson.duration / 60)} mins
                        </span>
                      ) : null}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 items-center">
                    {/* Mark as Completed */}
                    {completedLessons.includes(activeLesson._id) ? (
                      <span className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-500/10 text-emerald-400 font-medium rounded-lg text-sm border border-emerald-500/20">
                        <CheckedIcon className="h-4 w-4" /> Lesson Completed
                      </span>
                    ) : (
                      <button
                        onClick={() => completeMutation.mutate(activeLesson._id)}
                        disabled={completeMutation.isPending}
                        className="inline-flex items-center justify-center px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg text-sm hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50"
                      >
                        Mark as Completed <CheckCircle className="ml-1.5 h-4 w-4" />
                      </button>
                    )}

                    {/* Quiz button */}
                    <button
                      onClick={() => setShowQuiz(true)}
                      className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white font-medium rounded-lg text-sm hover:bg-primary/95 transition-all shadow-sm"
                    >
                      Take Quiz <HelpCircle className="ml-1.5 h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div>
                  <Tabs defaultValue="overview">
                    <TabsList className="bg-zinc-900/60 border border-zinc-800 w-full sm:w-auto">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="notes">Notes</TabsTrigger>
                      <TabsTrigger value="qna">Q&A</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-6 p-6 bg-zinc-900/30 rounded-xl border border-zinc-800">
                      <h3 className="text-lg font-semibold mb-3 text-white">Course Details</h3>
                      <p className="text-zinc-400 leading-relaxed">{course.description || "No description provided."}</p>
                      
                      <div className="mt-6 pt-6 border-t border-zinc-800 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                          {course.instructor?.name?.substring(0, 2).toUpperCase() || "IN"}
                        </div>
                        <div>
                          <p className="text-white font-medium">Instructor: {course.instructor?.name}</p>
                          <p className="text-xs text-zinc-500">{course.instructor?.email}</p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="notes" className="mt-6 p-6 bg-zinc-900/30 rounded-xl border border-zinc-800">
                      <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                        <StickyNote className="h-5 w-5 text-yellow-400" /> Lesson Notes
                      </h3>
                      <div className="flex gap-2 mb-6">
                        <Textarea
                          placeholder="Jot down notes for this lesson..."
                          className="bg-zinc-900 border-zinc-700 text-white resize-none h-20"
                          value={noteText}
                          onChange={e => setNoteText(e.target.value)}
                        />
                        <Button onClick={() => {
                          if (noteText.trim()) {
                            setNotes([...notes, { text: noteText.trim() }]);
                            setNoteText("");
                            toast.success("Note saved!");
                          }
                        }} className="bg-primary hover:bg-primary/90 self-end">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                      {notes.length === 0 ? (
                        <p className="text-zinc-500 text-sm text-center py-8">No notes yet. Jot down key insights!</p>
                      ) : (
                        <div className="space-y-3">
                          {notes.map((n, i) => (
                            <div key={i} className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                              <p className="text-zinc-300 text-sm">{n.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="qna" className="mt-6 p-6 bg-zinc-900/30 rounded-xl border border-zinc-800">
                      <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-400" /> Discussion Q&A
                      </h3>
                      <div className="flex gap-2 mb-6">
                        <Textarea
                          placeholder="Ask a question about this course..."
                          className="bg-zinc-900 border-zinc-700 text-white resize-none h-20"
                          value={question}
                          onChange={e => setQuestion(e.target.value)}
                        />
                        <Button onClick={() => {
                          if (question.trim()) {
                            setLocalQna([{ q: question.trim(), a: "Your question has been submitted! An instructor will reply soon.", votes: 0 }, ...localQna]);
                            setQuestion("");
                            toast.success("Question submitted!");
                          }
                        }} className="bg-blue-600 hover:bg-blue-700 self-end">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                      {localQna.length === 0 ? (
                        <p className="text-zinc-500 text-sm text-center py-8">No questions asked yet. Be the first to start the conversation!</p>
                      ) : (
                        <div className="space-y-4">
                          {localQna.map((item, i) => (
                            <div key={i} className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 text-left">
                              <p className="text-white font-medium mb-2">❓ {item.q}</p>
                              <p className="text-zinc-400 text-sm pl-5 border-l-2 border-primary/40 leading-relaxed">{item.a}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center aspect-video bg-zinc-900 rounded-2xl border border-zinc-800 text-zinc-500">
                No active lesson selected.
              </div>
            )}
          </div>

          {/* ── Sidebar (Curriculum Tree) ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:w-1/4"
          >
            <div className="sticky top-24 space-y-5">
              {/* Course Progress Card */}
              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5 text-left">
                <h3 className="font-bold text-white">Curriculum Progress</h3>
                <p className="text-xs text-zinc-500 mt-1">{completedLessons.length} lessons completed</p>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-2">{progressPercent}% complete</p>
              </div>

              {/* Curriculum Chapters/Lessons */}
              <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 overflow-hidden text-left">
                <div className="p-4 border-b border-zinc-800">
                  <h3 className="font-bold text-white">Syllabus Index</h3>
                </div>
                <div className="max-h-[420px] overflow-y-auto divide-y divide-zinc-800/40">
                  {course.modules.map((mod, modIdx) => (
                    <div key={mod._id} className="p-3">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        CH {modIdx + 1}: {mod.title}
                      </h4>
                      <div className="flex flex-col gap-1">
                        {mod.lessons.map((les) => {
                          const isDone = completedLessons.includes(les._id);
                          const isActive = activeLesson?._id === les._id;
                          return (
                            <button
                              key={les._id}
                              onClick={() => {
                                setActiveLesson(les);
                                setShowQuiz(false);
                              }}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                                isActive ? "bg-primary/10 text-primary" : "hover:bg-zinc-800/50 text-zinc-300"
                              }`}
                            >
                              <div className="flex-shrink-0">
                                {isDone ? (
                                  <CheckedIcon className="h-4 w-4 text-emerald-400 fill-emerald-500/10" />
                                ) : les.type === "video" ? (
                                  <PlayCircle className="h-4 w-4 text-zinc-500" />
                                ) : les.type === "live" ? (
                                  <Video className="h-4 w-4 text-emerald-400 animate-pulse" />
                                ) : (
                                  <FileText className="h-4 w-4 text-zinc-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium truncate ${isActive ? "text-primary font-bold" : ""}`}>
                                  {les.title}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Quiz Modal overlay */}
      {showQuiz && activeLesson && (
        <QuizPortal
          lessonId={activeLesson._id}
          onClose={() => setShowQuiz(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["course-progress", courseId] });
          }}
        />
      )}
    </div>
  );
}
