import { Link } from "react-router-dom";
import { Play, Clock, Star, BookOpen } from "lucide-react";
import { Video } from "@/services/contentService";
import { Badge } from "@/components/ui/badge";

interface ContentCardProps {
  video: Video;
  progress?: number;
  badge?: string;
}

// Topic-based gradient fallbacks
const TOPIC_GRADIENTS: Record<string, string> = {
  react: "from-blue-600 to-cyan-500",
  python: "from-yellow-500 to-orange-500",
  aws: "from-orange-500 to-yellow-600",
  javascript: "from-yellow-400 to-amber-500",
  node: "from-green-500 to-emerald-600",
  data: "from-purple-600 to-pink-500",
  ml: "from-pink-600 to-rose-500",
  cloud: "from-sky-500 to-blue-600",
  default: "from-primary to-purple-600",
};

function getGradient(title: string, courseId: string) {
  const text = `${title} ${courseId}`.toLowerCase();
  const key = Object.keys(TOPIC_GRADIENTS).find(k => text.includes(k));
  return TOPIC_GRADIENTS[key || "default"];
}

function formatDuration(seconds: number) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ContentCard({ video, progress, badge }: ContentCardProps) {
  const gradient = getGradient(video.title, video.courseId);

  return (
    <Link to={`/course-player/${video.courseId || video.id}`} className="block group">
      <div className="relative h-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all duration-300 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-1">

        {/* Thumbnail */}
        <div className="relative h-44 overflow-hidden bg-zinc-800">
          {video.thumbnail ? (
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <BookOpen className="h-10 w-10 text-white/40" />
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
            <div className="bg-white rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100 shadow-xl">
              <Play className="h-5 w-5 text-black fill-black" />
            </div>
          </div>

          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded-md backdrop-blur-sm font-mono">
            {formatDuration(video.duration)}
          </div>

          {/* Custom badge */}
          {badge && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-primary text-white text-xs shadow">{badge}</Badge>
            </div>
          )}

          {/* Status indicator */}
          {video.status !== "READY" && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-zinc-800/80 text-zinc-300 text-xs backdrop-blur-sm">
                {video.status}
              </Badge>
            </div>
          )}

          {/* Progress bar */}
          {progress !== undefined && progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-4">
          <h3 className="font-semibold text-white line-clamp-2 group-hover:text-primary transition-colors text-sm leading-snug">
            {video.title}
          </h3>

          {video.description && (
            <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">
              {video.description}
            </p>
          )}

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`h-3 w-3 ${s <= 4 ? "fill-yellow-400 text-yellow-400" : "text-zinc-700"}`} />
              ))}
              <span className="text-xs text-zinc-500 ml-1">4.8</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Clock className="h-3 w-3" />
              {formatDuration(video.duration)}
            </div>
          </div>

          <div className="flex items-center justify-between mt-2">
            <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-[10px]">
              {video.courseId || "General"}
            </Badge>
            {progress !== undefined && (
              <span className="text-[10px] text-zinc-500">{progress}% done</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}