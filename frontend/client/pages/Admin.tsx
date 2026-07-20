import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Users, 
  Video, 
  Settings, 
  BarChart, 
  Search, 
  Bell,
  MoreVertical,
  PlayCircle,
  Home,
  Upload,
  Loader2,
  LogOut,
  Trash2,
  Edit,
  Eye,
  Shield,
  UserCheck,
  UserX,
  ChevronRight,
  Globe,
  Database,
  Lock,
  Mail,
  GraduationCap,
  Plus,
  PlusCircle,
  BookOpen,
  HelpCircle,
  Trash
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { contentService } from "@/services/contentService";
import { coursesService, Course } from "@/services/coursesService";
import api from "@/services/api";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

import { API_BASE_URL } from "@/services/api";

const STATS = [
  { title: "Total Users", value: "12,453", change: "+14%", icon: Users },
  { title: "Active Courses", value: "84", change: "+5%", icon: Video },
  { title: "Total Views", value: "1.2M", change: "+21%", icon: BarChart },
];

type AdminView = "dashboard" | "users" | "courses" | "content" | "settings";

export default function Admin() {
  const [currentView, setCurrentView] = useState<AdminView>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  
  // Upload state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [courseId, setCourseId] = useState("react-basics");
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Course builder states
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
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

  // Quiz Builder States
  const [showCreateQuiz, setShowCreateQuiz] = useState<string | null>(null); // lessonId
  const [questions, setQuestions] = useState<{ question: string; options: string[]; correctAnswerIndex: number }[]>([
    { question: "", options: ["", "", "", ""], correctAnswerIndex: 0 }
  ]);

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Edit state
  const [editVideo, setEditVideo] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  const clearAuth = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  };

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["admin-current-user"],
    queryFn: async () => {
      const response = await api.get("/users/profile");
      return response.data;
    },
    enabled: Boolean(localStorage.getItem("accessToken")),
    retry: false,
  });

  const isAdmin = currentUser?.role?.toUpperCase() === "ADMIN";

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  // --- Real Queries ---
  
  // Fetch Videos
  const { data: videos = [], isLoading: videosLoading } = useQuery({
    queryKey: ["admin-videos"],
    queryFn: () => contentService.getVideos({ limit: 50 }),
  });

  // Fetch Courses for Course Builder
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: coursesService.listCourses,
    enabled: currentView === "courses",
  });

  // Fetch Users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const response = await api.get("/users");
      return response.data;
    },
    enabled: currentView === "users",
  });

  // --- Course Builder Mutations ---

  const createCourseMutation = useMutation({
    mutationFn: () => coursesService.createCourse(cTitle, cDesc, cThumb),
    onSuccess: () => {
      toast.success("Course created successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      setCTitle(""); setCDesc(""); setCThumb("");
      setShowCreateCourse(false);
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: () => coursesService.addModule(selectedCourse!._id, mTitle, mDesc),
    onSuccess: (newModule) => {
      toast.success("Module added!");
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
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
      toast.success("Lesson added successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
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
    onError: () => {
      toast.error("Failed to build quiz.");
    }
  });

  const updateLiveStatusMutation = useMutation({
    mutationFn: ({ lessonId, status }: { lessonId: string; status: "scheduled" | "active" | "completed" }) =>
      coursesService.updateLiveStatus(lessonId, status),
    onSuccess: () => {
      toast.success("Live class status updated!");
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      if (selectedCourse) {
        coursesService.getCourseDetail(selectedCourse._id).then(setSelectedCourse);
      }
    },
    onError: () => {
      toast.error("Failed to update live class status.");
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

  // --- Mutations ---

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!videoFile) return;
      return contentService.uploadVideo({
        file: videoFile,
        title: uploadTitle,
        description: uploadDesc,
        courseId,
      });
    },
    onSuccess: () => {
      toast.success("Video uploaded successfully!");
      setUploadOpen(false);
      setUploadTitle("");
      setUploadDesc("");
      setVideoFile(null);
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Upload failed";
      toast.error(message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return contentService.deleteVideo(id);
    },
    onSuccess: () => {
      toast.success("Video deleted successfully");
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to delete video";
      toast.error(message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editVideo) return;
      return contentService.updateVideo(editVideo.id, {
        title: editTitle,
        description: editDesc
      });
    },
    onSuccess: () => {
      toast.success("Video updated successfully");
      setEditVideo(null);
      queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || "Failed to update video";
      toast.error(message);
    }
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success("User deactivated successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string, role: string }) => 
      api.patch(`/users/${id}/role`, { role }),
    onSuccess: () => {
      toast.success("User role updated");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
  });

  const handleEditClick = (video: any) => {
    setEditVideo(video);
    setEditTitle(video.title);
    setEditDesc(video.description || "");
  };

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: notifTitle,
          message: notifMessage,
          type: "GLOBAL",
        }),
      });
      if (!res.ok) throw new Error("Failed to send broadcast");
    },
    onSuccess: () => {
      toast.success("Broadcast sent successfully!");
      setNotifTitle("");
      setNotifMessage("");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: () => {
      toast.error("Failed to send broadcast. Make sure you are an Admin.");
    }
  });

  const renderDashboard = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h1>
        <p className="text-zinc-400">Welcome back, Admin. Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STATS.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-zinc-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">{stat.change} from last month</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <UserCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">New user registered</p>
                    <p className="text-xs text-zinc-500">2 minutes ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button onClick={() => setUploadOpen(true)} className="bg-primary hover:bg-primary/90 text-white gap-2">
              <Upload className="h-4 w-4" /> Upload Video
            </Button>
            <Button onClick={() => setCurrentView("users")} variant="outline" className="border-zinc-700 bg-zinc-900/50 text-white gap-2">
              <Users className="h-4 w-4" /> Manage Users
            </Button>
            <Button onClick={() => setCurrentView("settings")} variant="outline" className="border-zinc-700 bg-zinc-900/50 text-white gap-2">
              <Settings className="h-4 w-4" /> Site Settings
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="border-zinc-700 bg-zinc-900/50 text-white gap-2">
              <Globe className="h-4 w-4" /> Visit Site
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-zinc-400">View and manage all registered platform users.</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
          <Mail className="h-4 w-4" /> Export Users
        </Button>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-0">
          {usersLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-zinc-400">User</TableHead>
                  <TableHead className="text-zinc-400">Role</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Joined</TableHead>
                  <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: any) => (
                  <TableRow key={user.id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar || `https://avatar.vercel.sh/${user.email}`} />
                          <AvatarFallback>{user.firstName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-white">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-zinc-500">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={user.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}>
                        {user.isActive ? "Active" : "Deactivated"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white w-48">
                          <DropdownMenuItem 
                            className="cursor-pointer gap-2"
                            onClick={() => changeRoleMutation.mutate({ id: user.id, role: user.role === 'admin' ? 'student' : 'admin' })}
                          >
                            <Shield className="h-4 w-4" /> Make {user.role === 'admin' ? 'Student' : 'Admin'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-zinc-800" />
                          <DropdownMenuItem 
                            className="cursor-pointer text-red-500 focus:text-red-500 gap-2"
                            onClick={() => deactivateUserMutation.mutate(user.id)}
                          >
                            <UserX className="h-4 w-4" /> Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Content Library</h1>
          <p className="text-zinc-400">Upload, edit, and organize your video resources.</p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="bg-primary hover:bg-primary/90 text-white gap-2">
          <Upload className="h-4 w-4" /> Upload Video
        </Button>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="p-0">
          {videosLoading ? (
            <div className="p-10 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-zinc-400">Video Title</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Course</TableHead>
                  <TableHead className="text-zinc-400">Date</TableHead>
                  <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((video: any) => (
                  <TableRow key={video.id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="font-medium text-white">{video.title}</TableCell>
                    <TableCell>
                      <Badge className={video.status === 'READY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-400'}>
                        {video.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-300">{video.courseId}</TableCell>
                    <TableCell className="text-zinc-400">{new Date(video.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white w-40">
                          <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate(`/lms-player/${video.courseId || video.id}`)}><Eye className="h-4 w-4" /> View</DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => handleEditClick(video)}><Edit className="h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-zinc-800" />
                          <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500 gap-2" onClick={() => setDeleteId(video.id)}><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderCourses = () => (
    <div className="space-y-8 text-left">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Course & Curriculum Builder</h1>
        <p className="text-zinc-400">Design syllabus, structure chapters, add lessons, and build quizzes.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side: Course List */}
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
                    className="bg-zinc-950 border-zinc-800 text-white"
                    value={cTitle}
                    onChange={(e) => setCTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Course Description</Label>
                  <Textarea
                    placeholder="Describe what students will learn..."
                    className="bg-zinc-955 border-zinc-800 text-white h-20 resize-none"
                    value={cDesc}
                    onChange={(e) => setCDesc(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Thumbnail URL (Optional)</Label>
                  <Input
                    placeholder="https://example.com/thumb.jpg"
                    className="bg-zinc-950 border-zinc-800 text-white"
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
                    <p className="text-[10px] text-zinc-500 mt-0.5">{c.modules?.length || 0} Modules</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Course Curriculum Builder */}
        <div className="flex-1">
          {selectedCourse ? (
            <div className="space-y-6">
              {/* Course Detail Card */}
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
                        className="bg-zinc-950 border-zinc-800 text-white"
                        value={mTitle}
                        onChange={(e) => setMTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300">Description (Optional)</Label>
                      <Input
                        placeholder="Brief summary of lessons in this chapter..."
                        className="bg-zinc-950 border-zinc-800 text-white"
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

              {/* Modulessyllabus list */}
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

                      {/* Create Lesson panel */}
                      {showCreateLesson === mod._id && (
                        <Card className="mb-4 p-4 border-primary/20 bg-primary/5 space-y-4">
                          <h5 className="font-bold text-xs text-primary">Add Lesson to Module</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 space-y-2">
                              <Label className="text-zinc-300">Lesson Title</Label>
                              <Input
                                placeholder="e.g. Understanding JSX syntax"
                                className="bg-zinc-950 border-zinc-800 text-white"
                                value={lTitle}
                                onChange={(e) => setLTitle(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-zinc-300">Lesson Type</Label>
                              <select
                                value={lType}
                                onChange={(e) => setLType(e.target.value as any)}
                                className="w-full h-10 px-3 py-2 rounded-md bg-zinc-955 border border-zinc-800 text-zinc-300 text-sm focus:outline-none"
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
                                  className="w-full h-10 px-3 py-2 rounded-md bg-zinc-955 border border-zinc-800 text-zinc-300 text-sm focus:outline-none"
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
                                  className="bg-zinc-955 border-zinc-800 text-white font-mono h-28 resize-none"
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
                                    className="bg-zinc-955 border-zinc-800 text-white"
                                    value={lStartTime}
                                    onChange={(e) => setLStartTime(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-zinc-300">Duration (Minutes)</Label>
                                  <Input
                                    type="number"
                                    min={5}
                                    className="bg-zinc-955 border-zinc-800 text-white"
                                    value={lDuration}
                                    onChange={(e) => setLDuration(parseInt(e.target.value) || 60)}
                                  />
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                  <Label className="text-zinc-300">Meeting Room Name (Optional)</Label>
                                  <Input
                                    placeholder="e.g. advanced-react-discussion (Auto-generated if left blank)"
                                    className="bg-zinc-955 border-zinc-800 text-white"
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

                      {/* Lessons list */}
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
                                        className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px]"
                                      >
                                        Go Live
                                      </Button>
                                    )}
                                    {lesson.meetingStatus === "active" && (
                                      <Button
                                        size="sm"
                                        onClick={() => updateLiveStatusMutation.mutate({ lessonId: lesson._id, status: "completed" })}
                                        className="h-7 px-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px]"
                                      >
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

  const renderSettings = () => (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Site Settings</h1>
        <p className="text-zinc-400">Configure global platform parameters and notifications.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Broadcast Announcement</CardTitle>
              <CardDescription>Send a global notification to all registered users.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Title</Label>
                <Input 
                  placeholder="E.g., Server Maintenance" 
                  className="bg-zinc-900 border-zinc-800 text-white"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Message</Label>
                <Textarea 
                  placeholder="Type your message..." 
                  className="bg-zinc-900 border-zinc-800 h-24 text-white"
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                />
              </div>
              <Button 
                className="bg-primary hover:bg-primary/90 text-white gap-2"
                onClick={() => broadcastMutation.mutate()}
                disabled={broadcastMutation.isPending || !notifTitle || !notifMessage}
              >
                <Bell className="h-4 w-4" />
                {broadcastMutation.isPending ? "Sending..." : "Send Global Notification"}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">System Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Maintenance Mode</Label>
                    <p className="text-xs text-zinc-500">Temporarily disable user access for updates.</p>
                  </div>
                  <Switch />
               </div>
               <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">New User Registrations</Label>
                    <p className="text-xs text-zinc-500">Allow new users to create accounts.</p>
                  </div>
                  <Switch defaultChecked />
               </div>
               <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-white">Auto-Encoding</Label>
                    <p className="text-xs text-zinc-500">Automatically start encoding jobs on upload.</p>
                  </div>
                  <Switch defaultChecked />
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400 flex items-center gap-2"><Database className="h-4 w-4" /> Database</span>
                <Badge className="bg-emerald-500/10 text-emerald-500">Online</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400 flex items-center gap-2"><Globe className="h-4 w-4" /> Encoding Node</span>
                <Badge className="bg-emerald-500/10 text-emerald-500">Active</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400 flex items-center gap-2"><Lock className="h-4 w-4" /> Auth Service</span>
                <Badge className="bg-emerald-500/10 text-emerald-500">Healthy</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`w-64 bg-zinc-950 border-r border-zinc-800 hidden md:block flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full absolute'}`}>
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
              <span className="text-sm font-bold text-primary-foreground">E</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Admin</span>
          </Link>
        </div>
        <nav className="p-4 space-y-2">
          {[
            { id: "dashboard", name: "Dashboard", icon: BarChart },
            { id: "users", name: "Users", icon: Users },
            { id: "courses", name: "Course Builder", icon: GraduationCap },
            { id: "content", name: "Content", icon: Video },
            { id: "settings", name: "Settings", icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as AdminView)}
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
        <header className="h-16 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input placeholder="Search resources..." className="w-64 pl-9 bg-zinc-900 border-zinc-800" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full"><Bell className="h-5 w-5 text-zinc-400" /></Button>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={handleLogout}><LogOut className="h-5 w-5 text-zinc-400" /></Button>
            <Avatar className="h-9 w-9 border border-zinc-800"><AvatarImage src="https://i.pravatar.cc/150?u=admin" /><AvatarFallback>AD</AvatarFallback></Avatar>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
          {!isAdmin ? (
            <div className="flex items-center justify-center h-full">
              <Card className="max-w-md bg-zinc-900/50 border-zinc-800 text-center p-6">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Verifying Admin Access...</h2>
                <p className="text-zinc-400 mb-6">Checking your credentials. This won't take long.</p>
                <Button onClick={() => navigate("/auth")} className="w-full">Back to Login</Button>
              </Card>
            </div>
          ) : (
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {currentView === "dashboard" && renderDashboard()}
              {currentView === "users" && renderUsers()}
              {currentView === "courses" && renderCourses()}
              {currentView === "content" && renderContent()}
              {currentView === "settings" && renderSettings()}
            </motion.div>
          )}
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
              <Textarea placeholder="What is this video about?" className="bg-zinc-900 border-zinc-800" value={uploadDesc} onChange={(e) => setUploadDesc(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label className="text-zinc-300">Course ID</Label>
              <Input placeholder="react-basics" className="bg-zinc-900 border-zinc-800" value={courseId} onChange={(e) => setCourseId(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label className="text-zinc-300">Video File</Label>
              <Input type="file" accept="video/*" className="bg-zinc-900 border-zinc-800" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending || !videoFile || !uploadTitle} className="bg-primary hover:bg-primary/90 text-white">
              {uploadMutation.isPending ? "Uploading..." : "Upload Video"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editVideo} onOpenChange={(open) => !open && setEditVideo(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[425px]">
          <DialogHeader><DialogTitle>Edit Video Details</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label className="text-zinc-300">Video Title</Label><Input className="bg-zinc-900 border-zinc-800" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} /></div>
            <div className="grid gap-2"><Label className="text-zinc-300">Description</Label><Textarea className="bg-zinc-900 border-zinc-800 h-32" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditVideo(null)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending || !editTitle} className="bg-primary hover:bg-primary/90 text-white">
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader><DialogTitle>Are you absolutely sure?</DialogTitle></DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Permanently Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Quiz Modal Overlay */}
      {showCreateQuiz && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-xl rounded-xl shadow-lg relative overflow-hidden flex flex-col max-h-[85vh] text-left text-white">
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
                          className="w-full mt-0.5 bg-zinc-950 border-zinc-850 text-white text-xs"
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
