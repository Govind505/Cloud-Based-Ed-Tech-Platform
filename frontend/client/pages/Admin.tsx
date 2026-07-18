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
  Mail
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

type AdminView = "dashboard" | "users" | "content" | "settings";

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

  // Fetch Users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const response = await api.get("/users");
      return response.data;
    },
    enabled: currentView === "users",
  });

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
                          <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => navigate(`/course-player/${video.courseId || video.id}`)}><Eye className="h-4 w-4" /> View</DropdownMenuItem>
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
    </div>
  );
}
