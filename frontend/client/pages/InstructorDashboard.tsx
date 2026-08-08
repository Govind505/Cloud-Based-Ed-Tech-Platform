import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/services/api";
import { contentService } from "@/services/contentService";
import { coursesService } from "@/services/coursesService";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import {
  BarChart,
  Users,
  Video,
  Settings,
  Plus,
  Play,
  Trash2,
  Edit,
  Eye,
  LogOut,
  Home,
  PlusCircle,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Loader2,
  Search,
  Bell,
  CheckCircle,
  Megaphone,
  Radio,
  VideoIcon,
  ShieldAlert,
  Calendar
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type InstructorView = "dashboard" | "courses" | "content" | "broadcast" | "liveClasses";

export default function InstructorDashboard() {
  const [currentView, setCurrentView] = useState<InstructorView>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout, user } = useAuthStore();

  const isInstructor = user?.role === "instructor" || user?.role === "admin";

  // --- Course Builder States ---
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [cTitle, setCTitle] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cThumb, setCThumb] = useState("");

  const [showCreateModule, setShowCreateModule] = useState(false);
  const [mTitle, setMTitle] = useState("");
  const [mDesc, setMDesc] = useState("");

  const [showCreateLesson, setShowCreateLesson] = useState<string | null>(null); // moduleId
  const [lTitle, setLTitle] = useState("");
  const [lType, setLType] = useState<"video" | "text" | "live">("video");
  const [lContent, setLContent] = useState("");
  const [lVideoId, setLVideoId] = useState("");
  const [lMeetingId, setLMeetingId] = useState("");
  const [lStartTime, setLStartTime] = useState("");
  const [lDuration, setLDuration] = useState(60);

  // --- Standalone Live Classes Panel States ---
  const [schedCourseId, setSchedCourseId] = useState("");
  const [schedTitle, setSchedTitle] = useState("");
  const [schedStartTime, setSchedStartTime] = useState("");
  const [schedDuration, setSchedDuration] = useState(60);
  const [schedRoomName, setSchedRoomName] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  // --- Quiz Builder States ---
  const [showCreateQuiz, setShowCreateQuiz] = useState<string | null>(null); // lessonId
  const [questions, setQuestions] = useState<{ question: string; options: string[]; correctAnswerIndex: number }[]>([
    { question: "", options: ["", "", "", ""], correctAnswerIndex: 0 }
  ]);

  // --- Video Upload States ---
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [courseId, setCourseId] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // --- Broadcast States ---
  const [bTitle, setBTitle] = useState("");
  const [bMessage, setBMessage] = useState("");

  // --- Queries ---
  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ["instructor-videos"],
    queryFn: () => contentService.getVideos({ limit: 50 }),
    enabled: currentView === "content" || currentView === "courses",
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["instructor-courses"],
    queryFn: coursesService.listCourses,
    enabled: currentView === "courses" || currentView === "dashboard" || currentView === "liveClasses",
  });

  // --- Mutations ---
  const createCourseMutation = useMutation({
    mutationFn: () => coursesService.createCourse(cTitle, cDesc, cThumb),
    onSuccess: () => {
      toast.success("Course profile created!");
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      setCTitle(""); setCDesc(""); setCThumb("");
      setShowCreateCourse(false);
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: () => coursesService.addModule(selectedCourse!._id, mTitle, mDesc),
    onSuccess: (newModule) => {
      toast.success("Chapter added successfully!");
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
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
      meetingId: lType === "live" ? (lMeetingId || `CloudEdTech-${Math.random().toString(36).substring(2, 9).toUpperCase()}`) : undefined,
      startTime: lType === "live" ? lStartTime : undefined,
      duration: lType === "live" ? lDuration : 60,
    }),
    onSuccess: () => {
      toast.success("Lesson curriculum saved!");
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      if (selectedCourse) {
        coursesService.getCourseDetail(selectedCourse._id).then(setSelectedCourse);
      }
      setLTitle(""); setLContent(""); setLVideoId(""); setLMeetingId(""); setLStartTime(""); setLDuration(60);
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
  });

  const updateLiveStatusMutation = useMutation({
    mutationFn: ({ lessonId, status }: { lessonId: string; status: "scheduled" | "active" | "completed" }) =>
      coursesService.updateLiveStatus(lessonId, status),
    onSuccess: () => {
      toast.success("Live class status updated!");
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
      if (selectedCourse) {
        coursesService.getCourseDetail(selectedCourse._id).then(setSelectedCourse);
      }
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      return contentService.uploadVideo({
        file: videoFile,
        title: uploadTitle,
        description: uploadDesc,
        courseId,
      });
    },
    onSuccess: () => {
      toast.success("Video upload started! Transcoding in background...");
      queryClient.invalidateQueries({ queryKey: ["instructor-videos"] });
      setUploadTitle(""); setUploadDesc(""); setCourseId(""); setVideoFile(null);
      setUploadOpen(false);
    },
    onError: () => {
      toast.error("Failed to upload video.");
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: () => api.post("/notifications", { title: bTitle, message: bMessage, type: "GLOBAL" }),
    onSuccess: () => {
      toast.success("Broadcast message posted successfully!");
      setBTitle(""); setBMessage("");
    },
    onError: () => {
      toast.error("Failed to post broadcast announcement.");
    },
  });

  // --- Handlers ---
  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

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

  // Standalone Live Class Scheduling Action
  const handleScheduleLiveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedCourseId || !schedTitle.trim() || !schedStartTime) {
      toast.error("Please fill out all required fields.");
      return;
    }

    setIsScheduling(true);
    try {
      // 1. Get Course detail to find existing modules
      const course = await coursesService.getCourseDetail(schedCourseId);
      let targetModuleId = "";

      if (course.modules && course.modules.length > 0) {
        targetModuleId = course.modules[0]._id;
      } else {
        // Create a default Live Lectures module
        const newModule = await coursesService.addModule(
          schedCourseId,
          "Live Interactive Lectures",
          "All scheduled live video lectures"
        );
        targetModuleId = newModule._id;
      }

      // 2. Add the live lesson
      const meetingId = schedRoomName.trim() || `CloudEdTech-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      await coursesService.addLesson(targetModuleId, {
        title: schedTitle,
        type: "live",
        meetingId,
        startTime: schedStartTime,
        duration: schedDuration,
      });

      toast.success("Live class scheduled successfully!");
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });

      // Reset form
      setSchedTitle("");
      setSchedStartTime("");
      setSchedDuration(60);
      setSchedRoomName("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to schedule live class.");
    } finally {
      setIsScheduling(false);
    }
  };

  // --- RENDER PARTS ---
  const renderDashboard = () => (
    <div className="space-y-8 text-left">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Welcome back, {user?.firstName || "Instructor"}!</h1>
        <p className="text-zinc-400">Monitor course enrollments, active lecture sessions, and student broadcast stats.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-zinc-900/50 border-zinc-800 p-6 flex items-center gap-4 text-white">
          <div className="p-3 bg-primary/10 text-primary rounded-xl"><GraduationCap className="h-6 w-6" /></div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase">Published Courses</p>
            <p className="text-2xl font-black mt-1">{courses.length}</p>
          </div>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800 p-6 flex items-center gap-4 text-white">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><Users className="h-6 w-6" /></div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase">Total Students</p>
            <p className="text-2xl font-black mt-1">
              {courses.reduce((acc: number, cur: any) => acc + (cur.enrolledStudents?.length || 0), 0)}
            </p>
          </div>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800 p-6 flex items-center gap-4 text-white">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl"><Radio className="h-6 w-6" /></div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase">Active Live Classes</p>
            <p className="text-2xl font-black mt-1">Ready to Stream</p>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderCourses = () => (
    <div className="space-y-8 text-left">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Course & Curriculum Builder</h1>
        <p className="text-zinc-400">Design syllabus, structure chapters, add lessons, and build quizzes.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/3 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Course Library</h2>
            <Button
              size="sm"
              onClick={() => setShowCreateCourse(!showCreateCourse)}
              className="bg-primary hover:bg-primary/90 text-white gap-1"
            >
              New Course <Plus className="h-4 w-4" />
            </Button>
          </div>

          {showCreateCourse && (
            <Card className="bg-zinc-900/50 border-zinc-800 p-5">
              <h3 className="font-bold text-sm text-white mb-4">Create New Course Profile</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">Course Title</Label>
                  <Input
                    placeholder="e.g. Master React Hooks"
                    className="bg-zinc-905 border-zinc-800 text-white"
                    value={cTitle}
                    onChange={(e) => setCTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Course Description</Label>
                  <Textarea
                    placeholder="Describe what students will learn..."
                    className="bg-zinc-900 border-zinc-800 text-white h-20 resize-none"
                    value={cDesc}
                    onChange={(e) => setCDesc(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Thumbnail URL (Optional)</Label>
                  <Input
                    placeholder="https://example.com/thumb.jpg"
                    className="bg-zinc-900 border-zinc-800 text-white"
                    value={cThumb}
                    onChange={(e) => setCThumb(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowCreateCourse(false)}>Cancel</Button>
                  <Button size="sm" onClick={() => createCourseMutation.mutate()} disabled={!cTitle}>Save Profile</Button>
                </div>
              </div>
            </Card>
          )}

          {coursesLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : courses.length === 0 ? (
            <p className="text-sm text-zinc-500 italic text-center py-8">No courses created yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {courses.map((c: any) => (
                <button
                  key={c._id}
                  onClick={() => {
                    coursesService.getCourseDetail(c._id).then(setSelectedCourse);
                  }}
                  className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all ${
                    selectedCourse?._id === c._id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-zinc-800 bg-zinc-900/30 hover:bg-zinc-900/50 text-zinc-300"
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <h4 className="font-bold text-sm truncate text-white">{c.title}</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{c.modules?.length || 0} Chapters</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1">
          {selectedCourse ? (
            <div className="space-y-6">
              <Card className="bg-zinc-900/50 border-zinc-800 p-6">
                <h3 className="text-xl font-bold text-white">{selectedCourse.title}</h3>
                <p className="text-sm text-zinc-400 mt-2">{selectedCourse.description || "No description provided."}</p>
                <div className="mt-6 pt-4 border-t border-zinc-800/60 flex justify-between items-center flex-wrap gap-2">
                  <span className="text-xs text-zinc-500">Course ID: <span className="font-mono text-zinc-300">{selectedCourse._id}</span></span>
                  <Button
                    size="sm"
                    onClick={() => setShowCreateModule(!showCreateModule)}
                    className="bg-primary hover:bg-primary/90 text-white gap-1"
                  >
                    Add Chapter / Module <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
              </Card>

              {showCreateModule && (
                <Card className="bg-zinc-900/50 border-zinc-800 p-5">
                  <h4 className="font-bold text-sm text-white mb-4">Add Curriculum Chapter</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Chapter Title</Label>
                      <Input
                        placeholder="e.g. Chapter 1: Introduction to Frameworks"
                        className="bg-zinc-900 border-zinc-800 text-white"
                        value={mTitle}
                        onChange={(e) => setMTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Description (Optional)</Label>
                      <Input
                        placeholder="Brief summary of lessons in this chapter..."
                        className="bg-zinc-900 border-zinc-800 text-white"
                        value={mDesc}
                        onChange={(e) => setMDesc(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <Button variant="ghost" size="sm" onClick={() => setShowCreateModule(false)}>Cancel</Button>
                      <Button size="sm" onClick={() => createModuleMutation.mutate()} disabled={!mTitle}>Save Chapter</Button>
                    </div>
                  </div>
                </Card>
              )}

              <div className="space-y-4">
                {selectedCourse.modules?.length === 0 ? (
                  <div className="text-center py-10 bg-zinc-900/20 border border-zinc-800 border-dashed rounded-xl text-zinc-500 italic">
                    Curriculum syllabus is empty. Click "Add Chapter" to build your structure.
                  </div>
                ) : (
                  selectedCourse.modules.map((mod: any, modIdx: number) => (
                    <Card key={mod._id} className="bg-zinc-900/50 border-zinc-800 p-5">
                      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                        <div>
                          <h4 className="font-bold text-base text-white">Module {modIdx + 1}: {mod.title}</h4>
                          {mod.description && <p className="text-xs text-zinc-400 mt-0.5">{mod.description}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCreateLesson(mod._id)}
                          className="text-primary hover:text-primary/90 text-xs font-semibold"
                        >
                          + Add Lesson
                        </Button>
                      </div>

                      {showCreateLesson === mod._id && (
                        <Card className="mb-4 p-4 border-primary/20 bg-primary/5 space-y-4">
                          <h5 className="font-bold text-xs text-primary">Add Lesson to Module</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 space-y-2">
                              <Label className="text-zinc-300">Lesson Title</Label>
                              <Input
                                placeholder="e.g. Understanding JSX syntax"
                                className="bg-zinc-900 border-zinc-800 text-white"
                                value={lTitle}
                                onChange={(e) => setLTitle(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-zinc-300">Lesson Type</Label>
                              <select
                                value={lType}
                                onChange={(e) => setLType(e.target.value as any)}
                                className="w-full h-10 px-3 py-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none"
                              >
                                <option value="video">Video Lecture</option>
                                <option value="text">Text / Markdown Guide</option>
                                <option value="live">Live Class Session</option>
                              </select>
                            </div>
                            {lType === "video" && (
                              <div className="space-y-2">
                                <Label className="text-zinc-300">Select Uploaded Video</Label>
                                <select
                                  value={lVideoId}
                                  onChange={(e) => setLVideoId(e.target.value)}
                                  className="w-full h-10 px-3 py-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none"
                                >
                                  <option value="">-- Choose Transcoded Video --</option>
                                  {videos.map((v: any) => <option key={v.id} value={v.id}>{v.title}</option>)}
                                </select>
                              </div>
                            )}
                            {lType === "text" && (
                              <div className="md:col-span-2 space-y-2">
                                <Label className="text-zinc-300">Markdown Lesson Content</Label>
                                <Textarea
                                  placeholder="Write study guides, syntax references, or markdown course text..."
                                  className="bg-zinc-900 border-zinc-800 text-white font-mono h-28 resize-none"
                                  value={lContent}
                                  onChange={(e) => setLContent(e.target.value)}
                                />
                              </div>
                            )}
                            {lType === "live" && (
                              <>
                                <div className="space-y-2">
                                  <Label className="text-zinc-300">Start Date & Time</Label>
                                  <Input
                                    type="datetime-local"
                                    className="bg-zinc-900 border-zinc-800 text-white"
                                    value={lStartTime}
                                    onChange={(e) => setLStartTime(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-zinc-300">Duration (Minutes)</Label>
                                  <Input
                                    type="number"
                                    min={5}
                                    className="bg-zinc-900 border-zinc-800 text-white"
                                    value={lDuration}
                                    onChange={(e) => setLDuration(parseInt(e.target.value) || 60)}
                                  />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                  <Label className="text-zinc-300">Meeting Room Name (Optional)</Label>
                                  <Input
                                    placeholder="e.g. advanced-react-discussion (Auto-generated if left blank)"
                                    className="bg-zinc-900 border-zinc-800 text-white"
                                    value={lMeetingId}
                                    onChange={(e) => setLMeetingId(e.target.value)}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                          <div className="flex gap-2 justify-end pt-2">
                            <Button variant="ghost" size="sm" onClick={() => setShowCreateLesson(null)}>Cancel</Button>
                            <Button size="sm" onClick={() => createLessonMutation.mutate(mod._id)} disabled={!lTitle}>Save Lesson</Button>
                          </div>
                        </Card>
                      )}

                      <div className="border-t border-zinc-800/60 pt-3 space-y-2">
                        {mod.lessons?.length === 0 ? (
                          <p className="text-xs text-zinc-500 italic">No lessons added to this module yet.</p>
                        ) : (
                          mod.lessons.map((lesson: any, lessonIdx: number) => (
                            <div key={lesson._id} className="p-3 bg-zinc-900/30 border border-zinc-800 rounded-lg flex flex-col gap-2 md:flex-row md:items-center justify-between text-xs hover:bg-zinc-900/50 transition-colors">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <span className="font-semibold text-zinc-500">Lesson {lessonIdx + 1}:</span>
                                <span className="text-zinc-200 font-medium">{lesson.title}</span>
                                <Badge variant="outline" className="text-[9px] uppercase border-zinc-700 text-zinc-400">
                                  {lesson.type}
                                </Badge>
                                
                                {lesson.type === "live" && (
                                  <>
                                    {lesson.meetingStatus === "scheduled" && (
                                      <Badge className="bg-amber-500/10 border-amber-500/20 text-amber-400 text-[9px] uppercase">
                                        Scheduled
                                      </Badge>
                                    )}
                                    {lesson.meetingStatus === "active" && (
                                      <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[9px] uppercase animate-pulse">
                                        Live Now
                                      </Badge>
                                    )}
                                    {lesson.meetingStatus === "completed" && (
                                      <Badge className="bg-zinc-800 border-zinc-700 text-zinc-500 text-[9px] uppercase">
                                        Finished
                                      </Badge>
                                    )}
                                  </>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-3 justify-end">
                                {lesson.type === "live" && (
                                  <>
                                    {lesson.meetingStatus === "scheduled" && (
                                      <Button
                                        size="sm"
                                        onClick={() => updateLiveStatusMutation.mutate({ lessonId: lesson._id, status: "active" })}
                                        className="h-7 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] shadow-md shadow-emerald-600/30 transition-all hover:scale-105"
                                      >
                                        <span className="relative flex h-1.5 w-1.5 mr-1.5">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                        </span>
                                        Go Live
                                      </Button>
                                    )}
                                    {lesson.meetingStatus === "active" && (
                                      <Button
                                        size="sm"
                                        onClick={() => updateLiveStatusMutation.mutate({ lessonId: lesson._id, status: "completed" })}
                                        className="h-7 px-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] shadow-md shadow-rose-600/30 transition-all hover:scale-105"
                                      >
                                        <span className="relative flex h-1.5 w-1.5 mr-1.5">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                        </span>
                                        End Class
                                      </Button>
                                    )}
                                  </>
                                )}
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setShowCreateQuiz(lesson._id)}
                                  className="text-[10px] text-primary hover:text-primary/90 hover:underline p-0 h-auto"
                                >
                                  + Build Quiz Assessment
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center py-32 bg-zinc-900/10 border-zinc-800 border-dashed text-center p-8">
              <BookOpen className="h-16 w-16 text-zinc-700/60 mb-4" />
              <h3 className="text-lg font-bold text-white">No Course Selected</h3>
              <p className="text-sm text-zinc-500 mt-1 max-w-sm">
                Choose a course profile from the list to create modules, build lessons, link videos, and define assessments.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );

  const renderContent = () => (
    <div className="space-y-8 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Video Resource Library</h1>
          <p className="text-zinc-400">Upload and transcode MP4 source videos for lesson stream referencing.</p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="bg-primary hover:bg-primary/90 text-white gap-1">
          Upload Video <Plus className="h-4 w-4" />
        </Button>
      </div>

      {videosLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : videos.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 bg-zinc-900/10 border-zinc-800 text-center p-8">
          <Video className="h-12 w-12 text-zinc-700 mb-3" />
          <h3 className="font-bold text-white">No Videos Uploaded</h3>
          <p className="text-xs text-zinc-500 mt-1">Upload raw video files to start HLS transcoding.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video: any) => (
            <Card key={video.id} className="bg-zinc-900/40 border-zinc-850 overflow-hidden flex flex-col h-[280px]">
              <div className="relative aspect-video bg-black flex items-center justify-center text-zinc-500 border-b border-zinc-900">
                <Play className="h-8 w-8 text-zinc-700" />
                <span className="absolute bottom-2.5 right-2.5 text-[9px] font-mono bg-black/80 px-2 py-0.5 rounded border border-zinc-800">
                  {video.status}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white line-clamp-1">{video.title}</h4>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{video.description || "No description."}</p>
                </div>
                <div className="flex justify-between items-center text-[10px] text-zinc-600 mt-2">
                  <span>ID: {video.id}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderBroadcast = () => (
    <div className="space-y-8 text-left max-w-2xl">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Broadcast Announcement</h1>
        <p className="text-zinc-400">Send platform-wide broadcast alerts to student dashboards.</p>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800 p-6 space-y-5">
        <div className="space-y-2">
          <Label className="text-zinc-300">Announcement Title</Label>
          <Input
            placeholder="e.g. Schedule Update: Advanced React Live Session"
            className="bg-zinc-950 border-zinc-800 text-white"
            value={bTitle}
            onChange={(e) => setBTitle(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-zinc-300">Message Content</Label>
          <Textarea
            placeholder="Write announcement details here..."
            className="bg-zinc-900 border-zinc-800 text-white h-32 resize-none"
            value={bMessage}
            onChange={(e) => setBMessage(e.target.value)}
          />
        </div>

        <Button
          onClick={() => {
            if (!bTitle.trim() || !bMessage.trim()) {
              toast.error("Please fill out both the Title and Message fields.");
              return;
            }
            broadcastMutation.mutate();
          }}
          disabled={broadcastMutation.isPending}
          className="w-full bg-primary hover:bg-primary/95 text-white gap-2 font-bold py-2.5"
        >
          {broadcastMutation.isPending ? (
            <>Posting Announcement... <Loader2 className="h-4 w-4 animate-spin" /></>
          ) : (
            <>Post Global Broadcast <Megaphone className="h-4 w-4" /></>
          )}
        </Button>
      </Card>
    </div>
  );

  const renderLiveClasses = () => {
    // Collect all live lessons from courses
    const liveClassesList: any[] = [];
    courses.forEach((course: any) => {
      course.modules?.forEach((mod: any) => {
        mod.lessons?.forEach((lesson: any) => {
          if (lesson.type === "live") {
            liveClassesList.push({
              ...lesson,
              courseId: course._id,
              courseTitle: course.title,
              moduleId: mod._id,
            });
          }
        });
      });
    });

    return (
      <div className="space-y-8 text-left">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Live Virtual Classrooms</h1>
          <p className="text-zinc-400">Schedule WebRTC streaming classes and toggle live broadcasts for student learning.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Schedule Form */}
          <Card className="bg-zinc-900/50 border-zinc-800 p-6 h-fit space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Schedule Live Session
            </h3>
            
            <form onSubmit={handleScheduleLiveClass} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Choose Course</Label>
                <select
                  value={schedCourseId}
                  onChange={(e) => setSchedCourseId(e.target.value)}
                  className="w-full h-10 px-3 py-2 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm focus:outline-none"
                  required
                >
                  <option value="">-- Choose Target Course --</option>
                  {courses.map((c: any) => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Classroom Title</Label>
                <Input
                  placeholder="e.g. Advanced State Management Q&A"
                  value={schedTitle}
                  onChange={(e) => setSchedTitle(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Start Date & Time</Label>
                <Input
                  type="datetime-local"
                  value={schedStartTime}
                  onChange={(e) => setSchedStartTime(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Duration (Minutes)</Label>
                <Input
                  type="number"
                  min={5}
                  value={schedDuration}
                  onChange={(e) => setSchedDuration(parseInt(e.target.value) || 60)}
                  className="bg-zinc-900 border-zinc-800 text-white text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Custom Room ID (Optional)</Label>
                <Input
                  placeholder="e.g. react-hooks-live"
                  value={schedRoomName}
                  onChange={(e) => setSchedRoomName(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-white text-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={isScheduling}
                className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-2"
              >
                {isScheduling ? "Scheduling Session..." : "Schedule Live Class"}
              </Button>
            </form>
          </Card>

          {/* List of Scheduled Classes */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-white">Your Scheduled Classrooms</h3>

            {liveClassesList.length === 0 ? (
              <Card className="p-12 text-center bg-zinc-900/10 border-zinc-800 border-dashed text-zinc-500 italic">
                No live classes scheduled. Use the scheduler panel to create your first session.
              </Card>
            ) : (
              <div className="space-y-3">
                {liveClassesList.map((live: any) => (
                  <Card key={live._id} className="bg-zinc-900/40 border border-zinc-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-white text-sm">{live.title}</h4>
                        <Badge variant="outline" className="text-[9px] uppercase border-zinc-700 text-zinc-400">
                          {live.courseTitle}
                        </Badge>
                        {live.meetingStatus === "scheduled" && (
                          <Badge className="bg-amber-500/10 border-amber-500/20 text-amber-400 text-[9px] uppercase">
                            Scheduled
                          </Badge>
                        )}
                        {live.meetingStatus === "active" && (
                          <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-[9px] uppercase animate-pulse">
                            Live Now
                          </Badge>
                        )}
                        {live.meetingStatus === "completed" && (
                          <Badge className="bg-zinc-800 border-zinc-700 text-zinc-500 text-[9px] uppercase">
                            Finished
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">
                        Starts: {new Date(live.startTime).toLocaleString()} ({live.duration} mins)
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        Room Name: {live.meetingId}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                      {live.meetingStatus === "scheduled" && (
                        <Button
                          size="sm"
                          onClick={() => updateLiveStatusMutation.mutate({ lessonId: live._id, status: "active" })}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                        >
                          Go Live
                        </Button>
                      )}
                      {live.meetingStatus === "active" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => navigate(`/live/${live.meetingId}`)}
                            className="bg-primary hover:bg-primary/90 text-white font-bold text-xs gap-1"
                          >
                            <VideoIcon className="h-3.5 w-3.5" /> Enter
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => updateLiveStatusMutation.mutate({ lessonId: live._id, status: "completed" })}
                            className="bg-red-650 hover:bg-red-700 text-white font-bold text-xs"
                          >
                            End Class
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isInstructor) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-white text-center">
        <Card className="max-w-md bg-zinc-900/50 border-zinc-800 p-6 space-y-4">
          <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold">Unauthorized Access</h2>
          <p className="text-sm text-zinc-400">
            Instructor dashboard is restricted to authorized accounts only.
          </p>
          <Button onClick={() => navigate("/dashboard")} className="w-full">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`w-64 bg-zinc-900 border-r border-zinc-800 hidden md:block flex-shrink-0 transition-all duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full absolute"}`}>
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">C</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Instructor</span>
          </Link>
        </div>
        <nav className="p-4 space-y-2">
          {[
            { id: "dashboard", name: "Overview", icon: BarChart },
            { id: "courses", name: "Course Builder", icon: GraduationCap },
            { id: "liveClasses", name: "Live Classes", icon: Radio },
            { id: "content", name: "Media Manager", icon: Video },
            { id: "broadcast", name: "Broadcast", icon: Megaphone },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as InstructorView)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentView === item.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </button>
          ))}
          <div className="pt-8 mt-8 border-t border-zinc-800">
            <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors">
              <Home className="h-5 w-5" /> Back to Site
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-zinc-800 bg-zinc-955/50 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input placeholder="Search curriculum..." className="w-64 pl-9 bg-zinc-900 border-zinc-800" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={handleLogout}><LogOut className="h-5 w-5 text-zinc-400" /></Button>
            <Avatar className="h-9 w-9 border border-zinc-800"><AvatarImage src="https://i.pravatar.cc/150?u=instructor" /><AvatarFallback>IN</AvatarFallback></Avatar>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === "dashboard" && renderDashboard()}
            {currentView === "courses" && renderCourses()}
            {currentView === "content" && renderContent()}
            {currentView === "broadcast" && renderBroadcast()}
            {currentView === "liveClasses" && renderLiveClasses()}
          </motion.div>
        </div>
      </main>

      {/* Shared Modals/Dialogs */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Upload New Video</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-zinc-300">Video Title</Label>
              <Input placeholder="E.g. Advanced React Hooks" className="bg-zinc-900 border-zinc-800" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label className="text-zinc-300">Description</Label>
              <Textarea placeholder="Explain topics covered in video" className="bg-zinc-900 border-zinc-800 h-20 resize-none" value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label className="text-zinc-300">Reference Course ID</Label>
              <Input placeholder="e.g. react-basics" className="bg-zinc-900 border-zinc-800" value={courseId} onChange={(e) => setCourseId(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label className="text-zinc-300">Source MP4 File</Label>
              <Input type="file" accept="video/mp4" className="bg-zinc-900 border-zinc-800 text-xs" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending || !videoFile || !uploadTitle} className="bg-primary hover:bg-primary/90 text-white w-full">
              {uploadMutation.isPending ? "Uploading..." : "Begin Transcode"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Quiz Modal Overlay */}
      {showCreateQuiz && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-xl rounded-xl shadow-lg relative overflow-hidden flex flex-col max-h-[85vh] text-left text-white">
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/30 flex justify-between items-center">
              <h3 className="font-bold text-white">Create Lesson Quiz Assessment</h3>
              <button onClick={() => setShowCreateQuiz(null)} className="text-zinc-500 hover:text-white">X</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
              {questions.map((q, qIdx) => (
                <div key={qIdx} className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold text-xs text-primary">Question {qIdx + 1}</h5>
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
                    <label className="text-[10px] text-zinc-400 font-semibold">Question Text</label>
                    <Input
                      type="text"
                      className="w-full mt-1 bg-zinc-950 border-zinc-850 text-white text-xs"
                      placeholder="e.g. What hook is used for side-effects?"
                      value={q.question}
                      onChange={e => handleQuestionChange(qIdx, e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx}>
                        <label className="text-[9px] text-zinc-400 font-semibold">Option {oIdx + 1}</label>
                        <Input
                          type="text"
                          className="w-full mt-0.5 bg-zinc-900 border-zinc-850 text-white text-xs"
                          placeholder={`Option ${oIdx + 1}`}
                          value={opt}
                          onChange={e => handleOptionChange(qIdx, oIdx, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 font-semibold">Correct Answer Option</label>
                    <select
                      value={q.correctAnswerIndex}
                      onChange={e => handleCorrectAnswerChange(qIdx, parseInt(e.target.value))}
                      className="w-full h-9 mt-1 px-3 py-1.5 rounded-md bg-zinc-950 border border-zinc-850 text-zinc-300 text-xs focus:outline-none"
                    >
                      <option value={0}>Option 1</option>
                      <option value={1}>Option 2</option>
                      <option value={2}>Option 3</option>
                      <option value={3}>Option 4</option>
                    </select>
                  </div>
                </div>
              ))}

              <Button
                onClick={handleAddQuestion}
                variant="outline"
                className="w-full py-2.5 border-dashed border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900/50 text-xs rounded-xl"
              >
                + Add Another Question
              </Button>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900/10 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowCreateQuiz(null)}>Cancel</Button>
              <Button
                onClick={() => {
                  const invalid = questions.some(q => !q.question.trim() || q.options.some(o => !o.trim()));
                  if (invalid) {
                    toast.error("Please fill out all questions and option fields.");
                    return;
                  }
                  createQuizMutation.mutate(showCreateQuiz!);
                }}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Save Quiz Assessment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
