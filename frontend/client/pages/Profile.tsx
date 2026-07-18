import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import { useAuthStore } from "@/store/authStore";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Camera, User, Mail, Shield, Save, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const { user: authUser, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(authUser?.firstName || "");
  const [lastName, setLastName] = useState(authUser?.lastName || "");
  const [bio, setBio] = useState(authUser?.bio || "");

  // Fetch full profile data
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: userService.getProfile,
    onSuccess: (data) => {
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setBio(data.bio || "");
    }
  });

  // Avatar upload mutation
  const avatarMutation = useMutation({
    mutationFn: (file: File) => userService.updateAvatar(file),
    onSuccess: (data) => {
      toast.success("Profile picture updated!");
      setUser({ ...authUser, ...data });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Failed to upload image"),
  });

  // Profile update mutation
  const profileMutation = useMutation({
    mutationFn: (data: any) => userService.updateProfile(data),
    onSuccess: (data) => {
      toast.success("Profile updated successfully!");
      setUser({ ...authUser, ...data });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Failed to update profile"),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      avatarMutation.mutate(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate({ firstName, lastName, bio });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const avatarUrl = profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.email}`;

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header Section */}
          <div className="flex items-center gap-4 mb-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="rounded-full hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Profile Settings</h1>
              <p className="text-zinc-400">Manage your account information and preferences</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar: Photo Upload */}
            <div className="lg:col-span-1">
              <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center">
                <div className="relative group">
                  <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-primary/20 bg-zinc-800">
                    <img 
                      src={avatarUrl} 
                      alt="Avatar" 
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 h-10 w-10 bg-primary rounded-full flex items-center justify-center border-4 border-zinc-900 shadow-xl hover:scale-110 transition-transform active:scale-95"
                    disabled={avatarMutation.isLoading}
                  >
                    {avatarMutation.isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Camera className="h-5 w-5 text-white" />
                    )}
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
                
                <div className="mt-6 space-y-1">
                  <h3 className="text-xl font-semibold">{profile?.firstName} {profile?.lastName}</h3>
                  <div className="flex items-center justify-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                    <Shield className="h-3 w-3" />
                    {profile?.role}
                  </div>
                </div>

                <div className="w-full mt-8 pt-8 border-t border-white/5 space-y-4">
                  <div className="flex items-center gap-3 text-zinc-400">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm truncate">{profile?.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-400">
                    <User className="h-4 w-4" />
                    <span className="text-sm">Active Member</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-zinc-400">First Name</Label>
                    <Input 
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="bg-zinc-800/50 border-white/5 focus:border-primary/50 rounded-xl h-12"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-zinc-400">Last Name</Label>
                    <Input 
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="bg-zinc-800/50 border-white/5 focus:border-primary/50 rounded-xl h-12"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-400">Email Address</Label>
                  <Input 
                    id="email"
                    value={profile?.email}
                    disabled
                    className="bg-zinc-800/30 border-white/5 rounded-xl h-12 text-zinc-500 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-zinc-500 px-1 italic">Email cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-zinc-400">Bio</Label>
                  <Textarea 
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="bg-zinc-800/50 border-white/5 focus:border-primary/50 rounded-xl min-h-[120px] resize-none p-4"
                    placeholder="Tell us a bit about yourself..."
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 h-12 font-semibold shadow-lg shadow-primary/20 active:scale-95 transition-all"
                    disabled={profileMutation.isLoading}
                  >
                    {profileMutation.isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
