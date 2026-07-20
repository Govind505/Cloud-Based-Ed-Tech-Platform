import Header from "@/components/Header";
import { coursesService } from "@/services/coursesService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, BookOpen, GraduationCap, Play, Lock, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function CourseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: course, isLoading, error } = useQuery({
    queryKey: ["course-details", id],
    queryFn: () => coursesService.getCourseDetail(id!),
    enabled: !!id,
  });

  const enrollMutation = useMutation({
    mutationFn: () => coursesService.enrollStudent(id!),
    onSuccess: () => {
      toast.success("Enrolled successfully! Redirecting to LMS Course Player...");
      queryClient.invalidateQueries({ queryKey: ["course-details", id] });
      navigate(`/lms-player/${id}`);
    },
    onError: () => {
      toast.error("Failed to enroll in the course.");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <GraduationCap className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold text-foreground">Course Not Found</h2>
        <button onClick={() => navigate("/lms")} className="mt-4 text-primary hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to library
        </button>
      </div>
    );
  }

  const isEnrolled = course.enrolledStudents.includes(user?.email || "");

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Back btn */}
          <button onClick={() => navigate("/lms")} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1.5 mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Library
          </button>

          {/* Intro Card */}
          <div className="bg-card border border-border rounded-xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center shadow-sm">
            <div className="w-full md:w-1/3 aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center border border-border">
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className="object-cover w-full h-full" />
              ) : (
                <BookOpen className="h-14 w-14 text-primary/30" />
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">{course.title}</h1>
              <p className="text-sm text-muted-foreground mt-2">Instructed by <span className="font-medium text-foreground">{course.instructor?.name}</span></p>
              <p className="text-muted-foreground text-sm mt-3 line-clamp-3">{course.description || "No description provided."}</p>
              
              <div className="mt-6">
                {isEnrolled ? (
                  <button
                    onClick={() => navigate(`/lms-player/${course._id}`)}
                    className="w-full md:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg text-sm hover:bg-emerald-700 transition-all shadow-sm"
                  >
                    Start / Resume Learning <Play className="ml-2 h-4 w-4 fill-white" />
                  </button>
                ) : (
                  <button
                    onClick={() => enrollMutation.mutate()}
                    disabled={enrollMutation.isPending}
                    className="w-full md:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-primary text-white font-medium rounded-lg text-sm hover:bg-primary/95 transition-all shadow-sm disabled:opacity-50"
                  >
                    {enrollMutation.isPending ? "Enrolling..." : "Enroll in Course"} <GraduationCap className="ml-2 h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Curriculum Section */}
          <div className="mt-10">
            <h2 className="text-xl font-bold text-foreground mb-4">Course Curriculum</h2>
            {course.modules.length === 0 ? (
              <div className="text-center py-10 bg-card border border-border rounded-xl text-muted-foreground">
                No modules or chapters have been added to this curriculum yet.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {course.modules.map((mod, modIdx) => (
                  <motion.div
                    key={mod._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: modIdx * 0.08 }}
                    className="bg-card border border-border rounded-xl p-5 shadow-sm"
                  >
                    <h3 className="text-lg font-bold text-foreground">
                      Module {modIdx + 1}: {mod.title}
                    </h3>
                    {mod.description && <p className="text-sm text-muted-foreground mt-1">{mod.description}</p>}

                    <div className="mt-4 border-t border-border/60 pt-3 flex flex-col gap-2.5">
                      {mod.lessons.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No lessons in this module yet.</p>
                      ) : (
                        mod.lessons.map((lesson, lessonIdx) => (
                          <div key={lesson._id} className="flex items-center justify-between text-sm py-1">
                            <div className="flex items-center gap-2.5">
                              {isEnrolled ? (
                                <CheckCircle2 className="h-4.5 w-4.5 text-muted-foreground/40" />
                              ) : (
                                <Lock className="h-4 w-4 text-muted-foreground/30" />
                              )}
                              <span className="text-foreground/90 font-medium">
                                Lesson {lessonIdx + 1}: {lesson.title}
                              </span>
                              <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full capitalize font-semibold">
                                {lesson.type}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground font-mono">
                              {lesson.duration ? `${Math.round(lesson.duration / 60)} mins` : ""}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
