import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, PlayCircle, Clock, CheckCircle, Target, Award, BookOpen, Flame, Megaphone } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ContentRow from "@/components/ContentRow";
import { API_BASE_URL } from "@/services/api";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>({
    totalWatchTimeMinutes: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    badgesEarned: 0,
    recentActivity: []
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const dismissNotification = async (notifId: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`${API_BASE_URL}/notifications/${notifId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setNotifications(prev => prev.filter(n => n.id !== notifId));
    } catch (err) {
      console.error("Failed to dismiss notification", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          navigate('/auth');
          return;
        }

        const headers = {
          'Authorization': `Bearer ${token}`
        };

        const [profileRes, statsRes, notifRes] = await Promise.all([
          fetch(`${API_BASE_URL}/users/profile`, { headers }),
          fetch(`${API_BASE_URL}/analytics/user/stats`, { headers }).catch(() => null),
          fetch(`${API_BASE_URL}/notifications`, { headers }).catch(() => null)
        ]);

        if (!profileRes.ok) {
          if (profileRes.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            navigate('/auth');
          }
          throw new Error('Failed to fetch profile');
        }

        const userData = await profileRes.json();
        if (userData.role?.toLowerCase() === "admin") {
          navigate("/admin", { replace: true });
          return;
        } else if (userData.role?.toLowerCase() === "instructor") {
          navigate("/instructor", { replace: true });
          return;
        }
        setUser(userData);

        if (statsRes && statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (notifRes && notifRes.ok) {
          const notifData = await notifRes.json();
          setNotifications(notifData);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Determine current video (mock logic: pick first enrolled or fallback)
  const currentCourse = user?.enrolledCourses?.[0] || {
    id: "react-basics",
    title: "Introduction to React",
    progress: 40,
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4"
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Header />
      
      <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
        
        {/* Broadcast Messages / Announcements Banner */}
        {notifications.filter(n => !n.isRead).map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between gap-4 text-white text-left shadow-lg backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <Megaphone className="h-5 w-5 text-red-400 animate-bounce flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-red-400 flex items-center gap-2">
                  ANNOUNCEMENT: {notif.title}
                </h4>
                <p className="text-xs text-zinc-300 mt-0.5">{notif.message}</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => dismissNotification(notif.id)}
              className="h-7 px-3 bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex-shrink-0"
            >
              Dismiss
            </Button>
          </motion.div>
        ))}
        
        {/* Welcome Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold">Welcome back, {user?.firstName || 'Student'}! 👋</h1>
            <p className="text-muted-foreground mt-2 text-lg">Pick up right where you left off.</p>
          </div>
          <div className="flex items-center gap-2 bg-zinc-900/50 px-4 py-2 rounded-lg border border-zinc-800">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="font-semibold">3 Day Streak!</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Video Section */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 space-y-4"
          >
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <PlayCircle className="text-primary h-6 w-6" /> Resume Learning
            </h2>
            <div className="rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-900 aspect-video relative group">
              <video
                controls
                className="w-full h-full object-cover"
                poster="https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200"
                src={currentCourse.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4"}
              />
              {/* Floating overlay for course info */}
              <div className="absolute top-0 left-0 w-full p-4 bg-gradient-to-b from-black/80 to-transparent pointer-events-none transition-opacity">
                <h3 className="font-bold text-white text-lg">{currentCourse.title || currentCourse.courseId}</h3>
                <p className="text-zinc-300 text-sm">Lesson 3 • 15 mins remaining</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
              <div className="flex-1 mr-4">
                <div className="flex justify-between text-sm mb-2 text-zinc-400">
                  <span>Course Progress</span>
                  <span>{currentCourse.progress || 0}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${currentCourse.progress || 0}%` }} />
                </div>
              </div>
              <Button onClick={() => navigate(`/course-player/${currentCourse.courseId || currentCourse.id}`)}>
                Continue <PlayCircle className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* Progress Dashboard Stats */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Target className="text-primary h-6 w-6" /> Your Stats
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-zinc-400 text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" /> Watch Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.floor(stats.totalWatchTimeMinutes / 60)}h {Math.round(stats.totalWatchTimeMinutes % 60)}m</div>
                  <p className="text-xs text-zinc-500 mt-1">Total stream time</p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-zinc-400 text-sm font-medium flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" /> Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.completedCourses} Courses</div>
                  <p className="text-xs text-zinc-500 mt-1">Keep it up!</p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-zinc-400 text-sm font-medium flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-purple-500" /> In Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.inProgressCourses}</div>
                  <p className="text-xs text-zinc-500 mt-1">Active courses</p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-zinc-400 text-sm font-medium flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-500" /> Badges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.badgesEarned}</div>
                  <p className="text-xs text-zinc-500 mt-1">Earned so far</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Activity Mini-Feed */}
            <div className="mt-8 p-6 rounded-xl bg-zinc-900/30 border border-zinc-800">
               <h3 className="font-semibold mb-4 text-zinc-200">Recent Activity</h3>
               <ul className="space-y-4">
                 {stats.recentActivity && stats.recentActivity.length > 0 ? stats.recentActivity.map((activity: any) => (
                   <li key={activity.id} className="flex items-center gap-3 text-sm">
                     <div className={`h-8 w-8 rounded-full flex items-center justify-center ${activity.type === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>
                       {activity.type === 'completed' ? <CheckCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                     </div>
                     <div>
                       <p className="text-zinc-300"><span className="font-medium text-white">{activity.title}</span></p>
                       <p className="text-zinc-500 text-xs">{new Date(activity.timestamp).toLocaleDateString()}</p>
                     </div>
                   </li>
                 )) : (
                   <li className="text-sm text-zinc-500">No recent activity</li>
                 )}
               </ul>
            </div>

          </motion.div>
        </div>

        {/* Enrolled Courses / My Learning Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="pt-8 border-t border-zinc-800/50"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Continue Learning</h2>
            <Link to="/lms" className="text-primary text-sm hover:underline">View all</Link>
          </div>
          {user?.enrolledCourses && user.enrolledCourses.length > 0 ? (
            <ContentRow title="" items={user.enrolledCourses} />
          ) : (
            <div className="text-center py-12 border border-zinc-800 rounded-xl bg-zinc-900/30">
              <p className="text-zinc-400 mb-4">You haven't enrolled in any courses yet.</p>
              <Button onClick={() => navigate('/lms')}>Open LMS Portal</Button>
            </div>
          )}
        </motion.div>
        
      </main>
    </div>
  );
}
