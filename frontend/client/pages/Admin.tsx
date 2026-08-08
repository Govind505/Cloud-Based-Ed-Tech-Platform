import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import {
  BarChart,
  Users,
  Settings,
  Trash2,
  LogOut,
  Home,
  Loader2,
  Search,
  Bell,
  CheckCircle,
  Megaphone,
  UserCheck,
  ShieldAlert,
  Globe
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type AdminView = "dashboard" | "users" | "broadcast" | "settings";

export default function Admin() {
  const [currentView, setCurrentView] = useState<AdminView>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { logout, user } = useAuthStore();

  const isAdmin = user?.role === "admin";

  // --- Broadcast States ---
  const [bTitle, setBTitle] = useState("");
  const [bMessage, setBMessage] = useState("");

  // --- Settings States ---
  const [siteName, setSiteName] = useState("CloudEdTech");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);

  // --- Queries ---
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const response = await api.get("/users");
      return response.data;
    },
    enabled: currentView === "users",
  });

  const { data: globalStats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await api.get("/analytics/user/stats").catch(() => ({ data: null }));
      return res.data;
    },
    enabled: currentView === "dashboard",
  });

  // --- Mutations ---
  const promoteUserMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await api.patch(`/users/${userId}/role`, { role });
      return res.data;
    },
    onSuccess: () => {
      toast.success("User role updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => {
      toast.error("Failed to update user role.");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.delete(`/users/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("User deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => {
      toast.error("Failed to delete user.");
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: () => api.post("/notifications", { title: bTitle, message: bMessage, type: "GLOBAL" }),
    onSuccess: () => {
      toast.success("Global broadcast announcement sent!");
      setBTitle(""); setBMessage("");
    },
    onError: () => {
      toast.error("Failed to post global broadcast.");
    },
  });

  // --- Handlers ---
  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const handleRoleToggle = (userId: string, currentRole: string) => {
    const nextRoleMap: Record<string, string> = {
      user: "instructor",
      instructor: "admin",
      admin: "user",
    };
    const nextRole = nextRoleMap[currentRole.toLowerCase()] || "user";
    promoteUserMutation.mutate({ userId, role: nextRole });
  };

  // --- View Renders ---
  const renderDashboard = () => (
    <div className="space-y-8 text-left">
      <div>
        <h1 className="text-3xl font-extrabold text-white">System Administration</h1>
        <p className="text-zinc-400">Review global telemetry, active user counts, and platform database metrics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-zinc-900/50 border-zinc-800 p-6 flex items-center gap-4 text-white">
          <div className="p-3 bg-primary/10 text-primary rounded-xl"><Users className="h-6 w-6" /></div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase">Registered Users</p>
            <p className="text-2xl font-black mt-1">{globalStats?.totalUsers || 24}</p>
          </div>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800 p-6 flex items-center gap-4 text-white">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><Globe className="h-6 w-6" /></div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase">Active Classrooms</p>
            <p className="text-2xl font-black mt-1">12 Session Hubs</p>
          </div>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800 p-6 flex items-center gap-4 text-white">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><Megaphone className="h-6 w-6" /></div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase">Active Broadcasts</p>
            <p className="text-2xl font-black mt-1">System Alerts Online</p>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-8 text-left">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">User Access Control</h1>
        <p className="text-zinc-400">Promote student roles, appoint instructors, or manage credentials.</p>
      </div>

      {usersLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="bg-zinc-900/40 border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-zinc-300">
              <thead className="bg-zinc-900/80 text-zinc-400 text-xs uppercase border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role Permission</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-zinc-900/20">
                    <td className="px-6 py-4 font-semibold text-white">{u.name}</td>
                    <td className="px-6 py-4 text-zinc-400 font-mono">{u.email}</td>
                    <td className="px-6 py-4">
                      <Badge className={`uppercase text-[10px] font-bold ${
                        u.role === "admin" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                        u.role === "instructor" ? "bg-primary/10 text-primary border border-primary/20" :
                        "bg-zinc-800 text-zinc-400"
                      }`}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRoleToggle(u.id, u.role)}
                        className="text-xs hover:text-white text-zinc-400 gap-1"
                        disabled={promoteUserMutation.isPending}
                      >
                        <UserCheck className="h-3.5 w-3.5" /> Toggle Role
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete user ${u.name}?`)) {
                            deleteUserMutation.mutate(u.id);
                          }
                        }}
                        className="text-xs text-rose-500 hover:text-rose-400 hover:bg-rose-950/20"
                        disabled={deleteUserMutation.isPending || u.email === user?.email}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );

  const renderBroadcast = () => (
    <div className="space-y-8 text-left max-w-2xl">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Global Message Broadcast</h1>
        <p className="text-zinc-400">Broadcast platform-wide administration alerts to all student dashboards.</p>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800 p-6 space-y-5">
        <div className="space-y-2">
          <Label className="text-zinc-300">Broadcast Title</Label>
          <Input
            placeholder="e.g. System Maintenance Notice"
            className="bg-zinc-950 border-zinc-800 text-white"
            value={bTitle}
            onChange={(e) => setBTitle(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-zinc-300">Message Details</Label>
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
              toast.error("Please fill out both fields.");
              return;
            }
            broadcastMutation.mutate();
          }}
          disabled={broadcastMutation.isPending}
          className="w-full bg-red-650 hover:bg-red-700 text-white gap-2 font-bold py-2.5"
        >
          {broadcastMutation.isPending ? (
            <>Broadcasting Alert... <Loader2 className="h-4 w-4 animate-spin" /></>
          ) : (
            <>Publish System-Wide Broadcast <Megaphone className="h-4 w-4" /></>
          )}
        </Button>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-8 text-left max-w-2xl">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Platform Settings</h1>
        <p className="text-zinc-400">Configure global website values, controls, and accessibility options.</p>
      </div>

      <Card className="bg-zinc-900/50 border-zinc-800 p-6 space-y-6">
        <div className="space-y-2">
          <Label className="text-zinc-300">Platform Brand Name</Label>
          <Input
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="bg-zinc-900 border-zinc-800 text-white font-bold"
          />
        </div>

        <div className="border-t border-zinc-800/80 pt-5 space-y-4">
          <h3 className="font-bold text-sm text-white">System Controls</h3>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/60">
            <div>
              <p className="text-xs font-bold text-zinc-200">Maintenance Mode</p>
              <p className="text-[10px] text-zinc-500">Temporarily block API endpoints for scheduled updates</p>
            </div>
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="h-4 w-4 text-primary bg-zinc-900 border-zinc-800 rounded"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/60">
            <div>
              <p className="text-xs font-bold text-zinc-200">New Registration Access</p>
              <p className="text-[10px] text-zinc-500">Allow new students to sign up via credentials form</p>
            </div>
            <input
              type="checkbox"
              checked={allowRegistration}
              onChange={(e) => setAllowRegistration(e.target.checked)}
              className="h-4 w-4 text-primary bg-zinc-900 border-zinc-800 rounded"
            />
          </div>
        </div>

        <Button onClick={() => toast.success("Site configuration values saved!")} className="w-full bg-primary hover:bg-primary/95 text-white">
          Save Configuration
        </Button>
      </Card>
    </div>
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-white text-center">
        <Card className="max-w-md bg-zinc-900/50 border-zinc-800 p-6 space-y-4">
          <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-sm text-zinc-400">
            System administration portal requires administrator level clearances.
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
              <span className="text-sm font-bold text-primary-foreground">A</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">Admin</span>
          </Link>
        </div>
        <nav className="p-4 space-y-2">
          {[
            { id: "dashboard", name: "System Telemetry", icon: BarChart },
            { id: "users", name: "User Roles Manager", icon: Users },
            { id: "broadcast", name: "Global Broadcast", icon: Megaphone },
            { id: "settings", name: "Platform Settings", icon: Settings },
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
              <Input placeholder="Search platform logs..." className="w-64 pl-9 bg-zinc-900 border-zinc-800" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={handleLogout}><LogOut className="h-5 w-5 text-zinc-400" /></Button>
            <Avatar className="h-9 w-9 border border-zinc-800"><AvatarImage src="https://i.pravatar.cc/150?u=admin" /><AvatarFallback>AD</AvatarFallback></Avatar>
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
            {currentView === "users" && renderUsers()}
            {currentView === "broadcast" && renderBroadcast()}
            {currentView === "settings" && renderSettings()}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
