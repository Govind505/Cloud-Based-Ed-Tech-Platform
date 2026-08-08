import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { ArrowLeft, Video, Users, HelpCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LiveClassroom() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const userName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Student";
  const userEmail = user?.email || "";

  // Jitsi Meet embedding via standard iframe (secure and zero-dependency)
  // Options passed via hash parameters block the pre-join page to get them directly into the class
  const jitsiUrl = `https://meet.jit.si/${meetingId}#config.prejoinPageEnabled=false&config.startWithAudioMuted=true&config.startWithVideoMuted=true&userInfo.displayName="${encodeURIComponent(userName)}"&userInfo.email="${encodeURIComponent(userEmail)}"`;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col text-white">
      {/* Mini Classroom Header */}
      <header className="h-16 border-b border-zinc-800 bg-zinc-900/60 backdrop-blur flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white"
            title="Leave classroom"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <h2 className="text-sm font-black tracking-wide text-white flex items-center gap-1.5">
                <Video className="h-4 w-4 text-emerald-400" /> LIVE CLASSROOM
              </h2>
              <p className="text-[10px] text-zinc-500 font-mono">Room: {meetingId}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 bg-zinc-850 px-3 py-1 rounded-full text-xs text-zinc-400 border border-zinc-800">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span>Interactive WebRTC Session</span>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm("Are you sure you want to leave the live class session?")) {
                navigate(-1);
              }
            }}
            className="text-xs font-bold"
          >
            Leave Room
          </Button>
        </div>
      </header>

      {/* Jitsi Video Grid Container */}
      <div className="flex-1 w-full bg-black relative">
        {meetingId ? (
          <iframe
            src={jitsiUrl}
            allow="camera; microphone; display-capture; fullscreen; clipboard-read; clipboard-write; gamepad"
            className="w-full h-full border-0 absolute inset-0"
            title="Jitsi Meet Virtual Classroom"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
            <ShieldAlert className="h-12 w-12 text-rose-500 animate-bounce" />
            <h3 className="text-lg font-bold">Invalid Classroom Room ID</h3>
            <p className="text-sm text-zinc-500 max-w-sm">
              The live class link is missing a valid Room ID parameter. Please return to the course player and try again.
            </p>
            <Button onClick={() => navigate("/lms")}>Return to LMS</Button>
          </div>
        )}
      </div>
    </div>
  );
}
