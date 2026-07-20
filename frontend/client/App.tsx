import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import Index from "./pages/Index";
import Watch from "./pages/Watch";
import Auth from "./pages/Auth";
import OAuthCallback from "./pages/OAuthCallback";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import CoursesList from "./pages/CoursesList";
import CourseDetails from "./pages/CourseDetails";
import CommunityChat from "./pages/CommunityChat";
import LiveClassroom from "./pages/LiveClassroom";
import { useAuthStore } from "./store/authStore";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

export default function App() {
  const initAuth = useAuthStore((state) => state.init);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />

            {/* User Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lms" 
              element={
                <ProtectedRoute>
                  <CoursesList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lms/:id" 
              element={
                <ProtectedRoute>
                  <CourseDetails />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lms-player/:id" 
              element={
                <ProtectedRoute>
                  <Watch />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/live/:meetingId" 
              element={
                <ProtectedRoute>
                  <LiveClassroom />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <CommunityChat />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />

            {/* Admin Protected Route */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin>
                  <Admin />
                </ProtectedRoute>
              } 
            />

            {/* Legacy redirects for removed pages */}
            <Route path="/courses" element={<Navigate to="/lms" replace />} />
            <Route path="/courses/:id" element={<Navigate to="/lms/:id" replace />} />
            <Route path="/course-player/:id" element={<Navigate to="/lms-player/:id" replace />} />
            <Route path="/browse" element={<Navigate to="/lms" replace />} />
            <Route path="/my-learning" element={<Navigate to="/dashboard" replace />} />
            <Route path="/instructor" element={<Navigate to="/admin" replace />} />
            <Route path="/watch/:id" element={<Navigate to="/lms" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>

      </TooltipProvider>
    </QueryClientProvider>
  );
}
