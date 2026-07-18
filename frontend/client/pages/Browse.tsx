import Header from "@/components/Header";
import ContentCard from "@/components/ContentCard";
import { contentService } from "@/services/contentService";
import { useQuery } from "@tanstack/react-query";
import { Loader2, LayoutGrid, List, SlidersHorizontal, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = ["All", "React", "Python", "JavaScript", "AWS", "Data Science", "AI/ML", "Web Dev", "DevOps"];
const SORT_OPTIONS = ["Newest", "Oldest", "A-Z", "Longest"];

export default function Browse() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("Newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["browse-videos"],
    queryFn: () => contentService.getVideos({ limit: 48 }),
  });

  const filtered = useMemo(() => {
    let result = [...videos];
    if (activeCategory !== "All") {
      result = result.filter(v =>
        v.title.toLowerCase().includes(activeCategory.toLowerCase()) ||
        v.courseId?.toLowerCase().includes(activeCategory.toLowerCase()) ||
        v.description?.toLowerCase().includes(activeCategory.toLowerCase())
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(v =>
        v.title.toLowerCase().includes(q) ||
        v.description?.toLowerCase().includes(q)
      );
    }
    if (sort === "Newest") result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sort === "Oldest") result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (sort === "A-Z") result.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "Longest") result.sort((a, b) => (b.duration || 0) - (a.duration || 0));
    return result;
  }, [videos, activeCategory, search, sort]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-foreground"
            >
              Browse Courses
            </motion.h1>
            <p className="text-muted-foreground mt-2">
              {isLoading ? "Loading..." : `${filtered.length} video${filtered.length !== 1 ? "s" : ""} available`}
            </p>
          </div>

          {/* Search + Controls */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-3 mb-6"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search videos..."
                className="pl-9 bg-card border-border"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 items-center">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="bg-card border border-border text-foreground text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon" onClick={() => setViewMode("grid")}
                className="h-9 w-9"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon" onClick={() => setViewMode("list")}
                className="h-9 w-9"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* Category Pills */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="flex gap-2 flex-wrap mb-8"
          >
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                  activeCategory === cat
                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                    : "bg-transparent border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>

          {/* Grid / List */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 h-[280px]">
                  <Skeleton className="aspect-video w-full rounded-lg" />
                  <Skeleton className="h-5 w-3/4 rounded mt-2" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-full rounded" />
                    <Skeleton className="h-3.5 w-5/6 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 gap-4 text-center"
            >
              <div className="text-6xl">🎓</div>
              <h3 className="text-xl font-semibold text-foreground">No videos found</h3>
              <p className="text-muted-foreground max-w-sm">
                {search ? `No results for "${search}"` : `No videos in the "${activeCategory}" category yet.`}
              </p>
              <button onClick={() => { setSearch(""); setActiveCategory("All"); }}
                className="text-primary hover:underline text-sm">Clear filters</button>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${viewMode}-${activeCategory}-${sort}`}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                  : "flex flex-col gap-4"
                }
              >
                {filtered.map((video, i) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  >
                    <ContentCard video={video} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
