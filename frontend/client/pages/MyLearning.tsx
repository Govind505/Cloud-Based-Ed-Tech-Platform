import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { Link, useNavigate } from "react-router-dom";
import ContentRow from "@/components/ContentRow";
import { Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/services/api";

export default function MyLearning() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          navigate('/auth');
          return;
        }

        const res = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            navigate('/auth');
          }
          throw new Error('Failed to fetch profile');
        }

        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Error fetching user profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">
              Welcome back, {user?.firstName || 'Student'}!
            </h1>
            <p className="text-lg text-muted-foreground">
              Ready to continue your learning journey?
            </p>
          </div>

          {user?.enrolledCourses && user.enrolledCourses.length > 0 ? (
            <div>
              <ContentRow title="Your Enrolled Courses" items={user.enrolledCourses} />
            </div>
          ) : (
            <div className="text-center py-20 border border-zinc-800 rounded-2xl bg-zinc-900/50">
              <h2 className="text-2xl font-semibold mb-4">No courses yet!</h2>
              <p className="text-zinc-400 mb-8 max-w-md mx-auto">
                You haven't enrolled in any courses yet. Explore our catalog and start learning today.
              </p>
              <Link
                to="/"
                className="inline-block px-6 py-3 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-all"
              >
                Browse Courses
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
