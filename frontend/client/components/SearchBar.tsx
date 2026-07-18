import { useState, useRef, useEffect } from "react";
import { Search, Loader2, Play, Command, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuthStore } from "@/store/authStore";
import { API_BASE_URL } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";

interface VideoResult {
  id: string;
  title: string;
  thumbnail?: string;
  duration: number;
  courseId?: string;
}

export default function SearchBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const { accessToken } = useAuthStore();

  // Shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsExpanded(true);
      }
      if (e.key === "Escape") {
        setIsExpanded(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: results, isLoading } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      
      const res = await fetch(`${API_BASE_URL}/content?search=${encodeURIComponent(debouncedQuery)}&limit=5`, {
        headers: {
          "Authorization": accessToken ? `Bearer ${accessToken}` : "",
        }
      });
      
      if (!res.ok) throw new Error("Search failed");
      return (await res.json()) as VideoResult[];
    },
    enabled: debouncedQuery.trim().length > 0,
  });

  const handleResultClick = (video: VideoResult) => {
    setIsExpanded(false);
    setSearchQuery("");
    navigate(`/course-player/${video.courseId || video.id}`);
  };

  return (
    <div ref={searchRef} className="relative">
      <div 
        className={`group flex items-center transition-all duration-300 ${
          isExpanded 
            ? "w-72 sm:w-80 bg-zinc-900 border-primary/50 ring-2 ring-primary/20 shadow-lg shadow-primary/10" 
            : "w-10 sm:w-48 bg-white/5 border-transparent hover:bg-white/10"
        } h-10 border rounded-full px-3 overflow-hidden cursor-text`}
        onClick={() => setIsExpanded(true)}
      >
        <Search className={`h-4 w-4 transition-colors ${isExpanded ? "text-primary" : "text-zinc-500 group-hover:text-zinc-300"}`} />
        
        <input
          type="text"
          placeholder={isExpanded ? "Search anything..." : "Quick search"}
          className={`flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-zinc-600 transition-all duration-300 ml-2 ${
            isExpanded ? "opacity-100" : "hidden sm:block opacity-60"
          }`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsExpanded(true)}
        />

        {!isExpanded && (
          <div className="hidden sm:flex items-center gap-1 opacity-40 group-hover:opacity-60 transition-opacity">
            <Command className="h-3 w-3" />
            <span className="text-[10px] font-bold">K</span>
          </div>
        )}

        {isExpanded && searchQuery && (
          <button onClick={(e) => { e.stopPropagation(); setSearchQuery(""); }} className="p-1 hover:bg-white/10 rounded-full">
            <X className="h-3 w-3 text-zinc-500" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      <AnimatePresence>
        {isExpanded && debouncedQuery.trim().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-12 right-0 w-80 sm:w-96 bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-[60]"
          >
            {isLoading ? (
              <div className="p-10 flex flex-col justify-center items-center gap-3 text-zinc-500">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs font-medium">Hunting for results...</span>
              </div>
            ) : results && results.length > 0 ? (
              <div className="p-2">
                <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex justify-between items-center">
                  <span>Found {results.length} results</span>
                  <span className="text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded">Videos</span>
                </div>
                <div className="space-y-1">
                  {results.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => handleResultClick(video)}
                      className="w-full text-left p-3 flex gap-4 hover:bg-primary/10 group/item rounded-xl transition-all items-center border border-transparent hover:border-primary/20"
                    >
                      <div className="relative w-20 h-12 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                        {video.thumbnail ? (
                          <img src={video.thumbnail} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="h-4 w-4 text-zinc-600 group-hover/item:text-primary transition-colors" />
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 bg-black/60 text-[8px] px-1 rounded font-bold text-white">
                          {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-200 truncate group-hover/item:text-primary transition-colors">{video.title}</p>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-tighter">Lesson • Watch now</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-10 text-center flex flex-col items-center gap-2">
                <Search className="h-8 w-8 text-zinc-800" />
                <p className="text-sm text-zinc-500">No results found for <span className="text-zinc-300 font-bold">"{debouncedQuery}"</span></p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
