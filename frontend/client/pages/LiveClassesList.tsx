import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import { coursesService } from "@/services/coursesService";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  VideoOff,
  Radio,
  Calendar,
  Clock,
  ExternalLink,
  Loader2,
  BookOpen,
  ArrowRight
} from "lucide-react";

export default function LiveClassesList() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Query all courses to extract live classes
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["student-courses-live"],
    queryFn: coursesService.listCourses,
    enabled: isAuthenticated,
  });

  // Extract all live classes from the courses structure
  const liveClasses: any[] = [];
  courses.forEach((course: any) => {
    course.modules?.forEach((mod: any) => {
      mod.lessons?.forEach((lesson: any) => {
        if (lesson.type === "live") {
          liveClasses.push({
            ...lesson,
            courseId: course._id,
            courseTitle: course.title,
            courseThumbnail: course.thumbnail,
            moduleId: mod._id,
          });
        }
      });
    });
  });

  // Sort: Active first, then scheduled by start time, then completed by start time
  const activeClasses = liveClasses.filter(l => l.meetingStatus === "active");
  const scheduledClasses = liveClasses
    .filter(l => l.meetingStatus === "scheduled")
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const completedClasses = liveClasses
    .filter(l => l.meetingStatus === "completed")
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col pb-20">
      <Header />

      <main className="flex-1 pt-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-12">
        {/* Page Hero Header */}
        <div className="text-left space-y-3">
          <Badge className="bg-primary/10 border-primary/20 text-primary font-bold uppercase text-[10px] tracking-wider px-3 py-1">
            Realtime Learning Hub
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Live Interactive Classrooms
          </h1>
          <p className="text-zinc-400 max-w-2xl text-base">
            Participate in lectures, ask questions, share screen, and coordinate projects with your peers in real-time.
          </p>
        </div>

        {/* 1. Active / Live Now Classes */}
        <div className="space-y-5">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" /> Live Lectures (Active Now)
          </h2>

          {activeClasses.length === 0 ? (
            <Card className="p-10 border-zinc-800 bg-zinc-900/10 flex flex-col items-center justify-center text-center text-zinc-500 rounded-2xl">
              <VideoOff className="h-10 w-10 mb-3 text-zinc-700" />
              <p className="text-sm italic">There are no live classes stream-active right now.</p>
              <p className="text-xs text-zinc-600 mt-1">Check scheduled lectures below to see when classes start.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeClasses.map((live) => (
                <motion.div
                  key={live._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative group p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 shadow-lg overflow-hidden flex flex-col justify-between h-[180px]"
                >
                  <div className="absolute top-0 right-0 p-3">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                  </div>

                  <div className="space-y-2 text-left">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      {live.courseTitle}
                    </span>
                    <h3 className="text-lg font-bold text-white line-clamp-1">{live.title}</h3>
                    <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> Duration: {live.duration} mins
                    </p>
                  </div>

                  <Button
                    onClick={() => navigate(`/live/${live.meetingId}`)}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold mt-4 shadow-lg shadow-emerald-500/10 gap-1.5 py-2.5 rounded-xl transition-all"
                  >
                    Join Virtual Classroom <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Scheduled Live Classes */}
        <div className="space-y-5">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Upcoming Scheduled Classes
          </h2>

          {scheduledClasses.length === 0 ? (
            <Card className="p-8 border-zinc-800 bg-zinc-900/10 text-center text-zinc-500 italic rounded-2xl">
              No live classes scheduled for your courses at this time.
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {scheduledClasses.map((live) => (
                <Card
                  key={live._id}
                  className="bg-zinc-900/40 border border-zinc-850 p-5 rounded-2xl flex flex-col justify-between h-[150px] text-left"
                >
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-primary font-semibold tracking-wide bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                        {live.courseTitle}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-sm mt-2 line-clamp-1">{live.title}</h3>
                    <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-zinc-500" /> Starts: {new Date(live.startTime).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800/40">
                    <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {live.duration} mins
                    </span>
                    <Badge variant="outline" className="text-[9px] uppercase border-zinc-800 text-zinc-500">
                      Scheduled
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 3. Completed Sessions */}
        {completedClasses.length > 0 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-400">
              <CheckCircle className="h-5 w-5 text-zinc-500" /> Previous Broadcast Archives
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-60">
              {completedClasses.map((live) => (
                <Card
                  key={live._id}
                  className="bg-zinc-900/30 border border-zinc-900 p-5 rounded-2xl flex flex-col justify-between h-[130px] text-left"
                >
                  <div>
                    <span className="text-[9px] text-zinc-500 font-semibold tracking-wide bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                      {live.courseTitle}
                    </span>
                    <h3 className="font-bold text-zinc-300 text-sm mt-2 line-clamp-1">{live.title}</h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Held: {new Date(live.startTime).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[10px] text-zinc-650">
                    <span>{live.duration} mins</span>
                    <Badge variant="secondary" className="text-[8px] bg-zinc-900 text-zinc-600">Ended</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
