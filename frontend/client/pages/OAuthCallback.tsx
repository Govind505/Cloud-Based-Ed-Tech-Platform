import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    const token = searchParams.get("token");
    const refresh = searchParams.get("refresh");
    const userStr = searchParams.get("user");

    if (token && refresh && userStr) {
      try {
        const user = JSON.parse(userStr);
        // Save auth state via store
        setAuth({
          accessToken: token,
          refreshToken: refresh,
          user,
        });

        toast({
          title: "Welcome!",
          description: `Successfully logged in via Google as ${user.firstName}.`,
        });

        navigate("/dashboard", { replace: true });
      } catch (error) {
        console.error("Failed to parse Google user data", error);
        toast({
          title: "Authentication Error",
          description: "Failed to read Google login information.",
          variant: "destructive",
        });
        navigate("/auth", { replace: true });
      }
    } else {
      const errorMsg = searchParams.get("error") || "Authentication failed.";
      toast({
        title: "Authentication Error",
        description: errorMsg,
        variant: "destructive",
      });
      navigate("/auth", { replace: true });
    }
  }, [searchParams, navigate, setAuth, toast]);

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
      
      <div className="relative z-10 flex flex-col items-center gap-6 text-center max-w-sm">
        <div className="h-16 w-16 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center shadow-xl">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">Finishing login</h2>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Please wait while we secure your learning session...
          </p>
        </div>
      </div>
    </div>
  );
}
