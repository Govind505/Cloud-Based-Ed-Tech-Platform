import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User, Lock, Mail, ArrowRight, Play, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/services/api";
import { useAuthStore } from "@/store/authStore";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'student' | 'instructor' | 'admin'>('student');
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth, isAuthenticated, user, login, register } = useAuthStore();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      toast({
        title: "Authentication Error",
        description: errorParam,
        variant: "destructive",
      });
      // Clear query parameters
      navigate("/auth", { replace: true });
    }
  }, [searchParams, toast, navigate]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  // Systematic check: if already logged in, redirect away from auth page
  useEffect(() => {
    if (isAuthenticated && user) {
      let defaultPath = "/dashboard";
      if (user.role?.toLowerCase() === "admin") {
        defaultPath = "/admin";
      } else if (user.role?.toLowerCase() === "instructor") {
        defaultPath = "/instructor";
      }
      const from = (location.state as any)?.from?.pathname || defaultPath;
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await login(email, password);
      toast({ title: "Welcome back!", description: "You have successfully logged in." });
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || err.message || 'Login failed', variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (role: 'student' | 'instructor' | 'admin') => {
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passInput = document.getElementById('password') as HTMLInputElement;
    if (emailInput && passInput) {
      emailInput.value = `${role}@cloudedtech.com`;
      passInput.value = 'password123';
      toast({ title: "Demo Credentials Filled", description: `Populated ${role.toUpperCase()} login: ${role}@cloudedtech.com` });
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = selectedRole;
    const [firstName, ...rest] = name.split(' ');
    const lastName = rest.join(' ') || 'User';

    try {
      await register(email, firstName, lastName, password, role);
      toast({ title: "Success!", description: `Account created successfully as ${role.toUpperCase()}.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || err.message || 'Registration failed', variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row overflow-hidden">
      {/* Decorative Side */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900 items-center justify-center p-12 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.15),transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,rgba(139,92,246,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50" />
        </div>

        <div className="relative z-10 max-w-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="mb-12"
          >
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-2xl shadow-primary/20 rotate-3">
              <Play className="h-10 w-10 text-white fill-current" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <h1 className="text-5xl font-black text-white leading-tight tracking-tight">
              Deploy your knowledge at <span className="text-primary">global scale</span>.
            </h1>
            <p className="text-zinc-400 text-xl leading-relaxed">
              Adaptive video learning. Optimized for modern engineers, developers, and builders.
            </p>
            
            <div className="grid grid-cols-2 gap-6 pt-8">
              {[
                { icon: <Play className="h-4 w-4" />, text: "4K Adaptive Streaming" },
                { icon: <ShieldCheck className="h-4 w-4" />, text: "Verified Certificates" },
                { icon: <CheckCircle2 className="h-4 w-4" />, text: "Expert Instructors" },
                { icon: <User className="h-4 w-4" />, text: "Personalized Path" },
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-sm font-medium text-zinc-300">
                  <div className="h-8 w-8 rounded-lg bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50">
                    {feature.icon}
                  </div>
                  {feature.text}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute inset-0 lg:hidden bg-zinc-950">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-[120px]" />
        </div>

        <motion.div 
          className="w-full max-w-[420px] relative z-10"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-10 lg:hidden flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Play className="h-5 w-5 text-white fill-current" />
             </div>
             <span className="text-2xl font-black text-white tracking-tighter">CloudEdTech</span>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white tracking-tight">Get Started</h2>
            <p className="text-zinc-500 mt-2">Enter your details to access your learning journey</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-zinc-900/50 p-1 rounded-full border border-zinc-800">
              <TabsTrigger value="login" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">Login</TabsTrigger>
              <TabsTrigger value="register" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                    <Input 
                      id="email" name="email" type="email" placeholder="name@company.com" 
                      className="pl-11 h-12 bg-zinc-900/50 border-zinc-800 focus:border-primary/50 focus:ring-primary/20 rounded-xl" required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" dir="ltr" className="text-xs font-bold uppercase tracking-wider text-zinc-500">Password</Label>
                    <Link to="#" className="text-xs text-primary font-bold hover:underline">Forgot password?</Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                    <Input 
                      id="password" name="password" type="password" placeholder="••••••••"
                      dir="ltr"
                      className="pl-11 h-12 bg-zinc-900/50 border-zinc-800 focus:border-primary/50 focus:ring-primary/20 rounded-xl" required 
                    />
                  </div>
                </div>

                {/* Demo Quick Fill Buttons */}
                <div className="pt-1">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 block mb-2">Quick Demo Credentials</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => fillDemoAccount('student')} className="text-xs h-8 border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-white hover:bg-zinc-800">
                      Student
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => fillDemoAccount('instructor')} className="text-xs h-8 border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-white hover:bg-zinc-800">
                      Instructor
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => fillDemoAccount('admin')} className="text-xs h-8 border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-white hover:bg-zinc-800">
                      Admin
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 bg-primary text-white hover:bg-primary/90 font-bold rounded-xl shadow-lg shadow-primary/20 mt-2" disabled={isLoading}>
                  {isLoading ? "Authenticating..." : (
                    <>
                      Sign in to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Full Name</Label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                    <Input 
                      id="name" name="name" placeholder="John Doe" 
                      className="pl-11 h-12 bg-zinc-900/50 border-zinc-800 focus:border-primary/50 focus:ring-primary/20 rounded-xl" required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                    <Input 
                      id="reg-email" name="email" type="email" placeholder="name@company.com" 
                      className="pl-11 h-12 bg-zinc-900/50 border-zinc-800 focus:border-primary/50 focus:ring-primary/20 rounded-xl" required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password" dir="ltr" className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Password</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                    <Input 
                      id="reg-password" name="password" type="password" placeholder="Min. 8 characters"
                      dir="ltr"
                      className="pl-11 h-12 bg-zinc-900/50 border-zinc-800 focus:border-primary/50 focus:ring-primary/20 rounded-xl" required minLength={8}
                    />
                  </div>
                </div>

                {/* Role Selector */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500 ml-1">Account Role</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { role: 'student', label: 'Student' },
                      { role: 'instructor', label: 'Instructor' },
                      { role: 'admin', label: 'Admin' },
                    ].map((r) => (
                      <Button
                        key={r.role}
                        type="button"
                        variant={selectedRole === r.role ? 'default' : 'outline'}
                        onClick={() => setSelectedRole(r.role as any)}
                        className={`h-10 text-xs font-bold rounded-xl ${
                          selectedRole === r.role 
                            ? 'bg-primary text-white border-primary' 
                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {r.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 bg-primary text-white hover:bg-primary/90 font-bold rounded-xl shadow-lg shadow-primary/20 mt-2" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : (
                    <>
                      Create Your Account <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-800" />
            </div>
            <span className="relative bg-zinc-950 px-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">
              Or
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 bg-transparent hover:bg-zinc-900/50 border-zinc-800 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-colors"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 0, 0)">
                <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.57h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.49C21.68,12.02 21.56,11.52 21.35,11.1z" fill="#4285F4" />
                <path d="M12,20.9c2.4,0 4.4,-0.8 5.88,-2.16l-3.3,-2.57c-0.91,0.61 -2.08,0.97 -3.23,0.97 -2.48,0 -4.59,-1.68 -5.34,-3.93H2.03v2.66c1.49,2.96 4.54,4.98 8.08,4.98z" fill="#34A853" />
                <path d="M6.66,13.22c-0.19,-0.57 -0.3,-1.18 -0.3,-1.8s0.11,-1.23 0.3,-1.8V6.96H2.03c-0.7,1.4 -1.1,2.97 -1.1,4.66s0.4,3.26 1.1,4.66L6.66,13.22z" fill="#FBBC05" />
                <path d="M12,5.77c1.31,0 2.48,0.45 3.4,1.33l2.55,-2.55C16.4,3.08 14.4,2.2 12,2.2c-3.54,0 -6.59,2.02 -8.08,4.98l4.63,3.59c0.75,-2.25 2.86,-3.93 5.34,-3.93z" fill="#EA4335" />
              </g>
            </svg>
            Continue with Google
          </Button>
          
          <div className="mt-10 flex flex-col items-center gap-6">
             <div className="flex items-center gap-4 w-full">
                <div className="h-[1px] flex-1 bg-zinc-800" />
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Secure Login</span>
                <div className="h-[1px] flex-1 bg-zinc-800" />
             </div>
             <p className="text-center text-[11px] text-zinc-500 leading-relaxed">
               Protected by 256-bit encryption. By signing up, you agree to our{" "}
               <Link to="#" className="text-zinc-300 underline underline-offset-4 hover:text-primary transition-colors">Terms</Link>
               {" "}and{" "}
               <Link to="#" className="text-zinc-300 underline underline-offset-4 hover:text-primary transition-colors">Privacy</Link>.
             </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
