import { useState } from "react";
import { Bell, Check, Info, BellOff } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { useAuthStore } from "@/store/authStore";
import { API_BASE_URL } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "GLOBAL" | "DIRECT";
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { accessToken } = useAuthStore();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      if (!accessToken) return [];
      
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        }
      });
      
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return (await res.json()) as Notification[];
    },
    enabled: !!accessToken,
    refetchInterval: 30000, 
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        }
      });
      if (!res.ok) throw new Error("Failed to mark as read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative h-10 w-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all items-center justify-center flex">
          <Bell className={`h-5 w-5 transition-colors ${unreadCount > 0 ? "text-primary animate-pulse" : "text-zinc-500"}`} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-black text-primary-foreground shadow-lg shadow-primary/40 ring-2 ring-zinc-950">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 sm:w-96 p-0 mt-2 bg-zinc-900/95 backdrop-blur-xl border-zinc-800 rounded-2xl shadow-2xl overflow-hidden" align="end">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h4 className="font-bold text-sm text-white">Notifications</h4>
            <p className="text-[10px] text-zinc-500 mt-0.5">Stay updated with the latest content</p>
          </div>
          {unreadCount > 0 && (
            <Badge className="bg-primary/20 text-primary border-primary/20 text-[10px] font-bold">
              {unreadCount} NEW
            </Badge>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="p-10 flex flex-col items-center gap-3 text-zinc-500">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Loading updates...</span>
              </div>
            ) : notifications.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-12 text-center flex flex-col items-center gap-4"
              >
                <div className="h-16 w-16 rounded-full bg-zinc-800/50 flex items-center justify-center">
                  <BellOff className="h-8 w-8 text-zinc-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-300">All caught up!</p>
                  <p className="text-xs text-zinc-500 mt-1">No new notifications at the moment.</p>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notif, i) => (
                  <motion.div 
                    key={notif.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`p-4 border-b border-zinc-800/50 transition-colors group relative ${notif.isRead ? 'bg-transparent opacity-60' : 'bg-primary/5'}`}
                  >
                    <div className="flex gap-4">
                      <div className={`mt-1.5 shrink-0 h-2 w-2 rounded-full shadow-sm ${notif.isRead ? 'bg-zinc-700' : 'bg-primary shadow-primary/50'}`} />
                      <div className="flex-1 space-y-1.5 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-bold leading-tight ${notif.isRead ? 'text-zinc-400' : 'text-zinc-100'}`}>
                            {notif.title}
                          </p>
                          {notif.type === 'GLOBAL' && (
                            <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">Global</span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">
                          {notif.message}
                        </p>
                        <div className="flex items-center justify-between pt-2">
                          <p className="text-[9px] font-medium text-zinc-600 flex items-center gap-1">
                            <Info className="h-2.5 w-2.5" />
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </p>
                          {!notif.isRead && (
                            <button 
                              className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                              onClick={() => markAsRead.mutate(notif.id)}
                              disabled={markAsRead.isPending}
                            >
                              <Check className="h-3 w-3" />
                              Dismiss
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>
        
        {notifications.length > 0 && (
          <div className="p-3 bg-zinc-900 border-t border-zinc-800 text-center">
             <button className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 transition-colors">
                View All Notifications
             </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Temporary inline Badge component to avoid importing if it's not exported properly or to keep it simple.
// Actually, let's just use a normal div to be safe. I will fix the Badge usage below.
