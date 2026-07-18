import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/services/api";
import { useAuthStore } from "@/store/authStore";

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }, []);

  const handleAdminLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Admin login failed");
      }

      if (data.user?.role !== "admin") {
        throw new Error("This account is not an admin account.");
      }

      setAuth(data);
      toast({ title: "Admin login successful", description: "Welcome to the admin dashboard." });
      navigate("/admin");
    } catch (error: any) {
      toast({ title: "Admin login failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          role: "admin",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Admin account creation failed");
      }

      setAuth(data);
      toast({ title: "Admin account created", description: "You can now upload videos." });
      navigate("/admin");
    } catch (error: any) {
      toast({ title: "Could not create admin", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-zinc-800 bg-zinc-950/70 backdrop-blur-xl">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Admin Login</CardTitle>
              <CardDescription>Sign in or create an admin account for this local app.</CardDescription>
            </div>
          </CardHeader>

          <Tabs defaultValue="login" className="px-6 pb-6">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="create">Create Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleAdminLogin}>
                <CardContent className="space-y-4 px-0">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                      <Input
                        id="admin-email"
                        name="email"
                        type="email"
                        placeholder="admin@example.com"
                        className="pl-9 bg-zinc-900 border-zinc-800"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                      <Input
                        id="admin-password"
                        name="password"
                        type="password"
                        dir="ltr"
                        className="pl-9 bg-zinc-900 border-zinc-800"
                        required
                      />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4 px-0">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : (
                      <>
                        Sign in as admin <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <Link to="/auth" className="text-sm text-zinc-500 hover:text-white">
                    Use student login instead
                  </Link>
                </CardFooter>
              </form>
            </TabsContent>

            <TabsContent value="create">
              <form onSubmit={handleAdminRegister}>
                <CardContent className="space-y-4 px-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="admin-first-name">First Name</Label>
                      <Input
                        id="admin-first-name"
                        name="firstName"
                        className="bg-zinc-900 border-zinc-800"
                        required
                        minLength={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-last-name">Last Name</Label>
                      <Input
                        id="admin-last-name"
                        name="lastName"
                        className="bg-zinc-900 border-zinc-800"
                        required
                        minLength={2}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-admin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                      <Input
                        id="new-admin-email"
                        name="email"
                        type="email"
                        placeholder="admin@example.com"
                        className="pl-9 bg-zinc-900 border-zinc-800"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-admin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                      <Input
                        id="new-admin-password"
                        name="password"
                        type="password"
                        dir="ltr"
                        className="pl-9 bg-zinc-900 border-zinc-800"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-4 px-0">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating..." : (
                      <>
                        Create admin account <User className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <p className="text-center text-xs text-zinc-500">
                    This creates an admin user in your local Cloud Based Ed-Tech Platform database.
                  </p>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>
    </div>
  );
}
