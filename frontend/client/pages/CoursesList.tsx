import Header from "@/components/Header";
import { coursesService } from "@/services/coursesService";
import { useQuery } from "@tanstack/react-query";
import { Loader2, BookOpen, GraduationCap, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";

export default function CoursesList() {
  const { user } = useAuthStore();
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses-list"],
    queryFn: coursesService.listCourses,
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero/Header */}
          <div className="mb-10 text-center sm:text-left">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl"
            >
              LMS Portal
            </motion.h1>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
              Expand your capabilities with our adaptive curriculum. Access study guides, text resources, and interactive lectures.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm h-[380px] p-5 flex flex-col gap-4">
                  <Skeleton className="aspect-video w-full rounded-lg" />
                  <Skeleton className="h-6 w-3/4 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-5/6 rounded" />
                    <Skeleton className="h-4.5 w-1/2 rounded" />
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-border">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-4 w-16 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border rounded-xl p-8">
              <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground">No Courses Available</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                Check back shortly. Our instructors are currently publishing new course modules.
              </p>
              {user?.role === "instructor" || user?.role === "admin" ? (
                <Link
                  to="/admin"
                  className="mt-6 inline-flex items-center px-4 py-2 bg-primary text-white font-medium rounded-lg text-sm hover:bg-primary/90 transition-all"
                >
                  Create First Course <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, idx) => {
                const isEnrolled = course.enrolledStudents.includes(user?.email || "");
                return (
                  <motion.div
                     key={course._id}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: idx * 0.05 }}
                     className="group bg-card border border-border hover:border-primary/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-[380px]"
                   >
                     {/* Thumbnail */}
                     <div className="relative aspect-video bg-muted overflow-hidden">
                       {course.thumbnail ? (
                         <img
                           src={course.thumbnail}
                           alt={course.title}
                           className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                         />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
                           <BookOpen className="h-12 w-12 text-primary/40" />
                         </div>
                       )}
                       {isEnrolled && (
                         <span className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
                           Enrolled
                         </span>
                       )}
                     </div>
 
                     {/* Body */}
                     <div className="p-5 flex flex-col flex-1">
                       <h3 className="text-lg font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                         {course.title}
                       </h3>
                       <p className="text-sm text-muted-foreground mt-2 line-clamp-3 flex-1">
                         {course.description || "No description provided."}
                       </p>
                       
                       <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                         <span className="text-xs text-muted-foreground">
                           By {course.instructor?.name || "Instructor"}
                         </span>
                         
                         <Link
                           to={`/lms/${course._id}`}
                           className="inline-flex items-center text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                         >
                           View Details <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                         </Link>
                       </div>
                     </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
