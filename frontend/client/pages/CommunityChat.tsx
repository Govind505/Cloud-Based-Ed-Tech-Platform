import Header from "@/components/Header";
import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";
import { API_BASE_URL } from "@/services/api";
import { Loader2, Plus, Send, FileText, Download, Users, MessageSquare, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

interface ChatRoom {
  _id: string;
  name: string;
  isGroup: boolean;
  participants: string[];
  createdBy: string;
}

interface Message {
  _id: string;
  roomId: string;
  senderEmail: string;
  senderName: string;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
}

export default function CommunityChat() {
  const { user } = useAuthStore();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Loaders
  const [isRoomsLoading, setIsRoomsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Group creation modal state
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [participantInput, setParticipantInput] = useState("");
  
  const activeRoomRef = useRef<ChatRoom | null>(null);
  activeRoomRef.current = activeRoom;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getRoomId = (room: ChatRoom | null | undefined): string => {
    if (!room) return "";
    return room._id || (room as any).id || "";
  };

  // Fetch Rooms
  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE_URL}/chat/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(res.data);
      if (res.data.length > 0 && !activeRoomRef.current) {
        setActiveRoom(res.data[0]);
      }
    } catch (err) {
      toast.error("Failed to retrieve chat rooms.");
    } finally {
      setIsRoomsLoading(false);
    }
  };

  // Fetch Messages in Active Room
  const fetchMessages = async (roomId: string) => {
    if (!roomId) return;
    setIsMessagesLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.get(`${API_BASE_URL}/chat/rooms/${roomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
    } catch (err) {
      toast.error("Failed to load conversation history.");
    } finally {
      setIsMessagesLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Connect WebSockets ONCE on mount
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const socketUrl = API_BASE_URL.startsWith("http")
      ? `${API_BASE_URL.replace(/\/api$/, "")}/chat`
      : "/chat";

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ["polling", "websocket"],
    });

    newSocket.on("connect", () => {
      console.log("WebSocket connected to Chat namespace");
      setSocket(newSocket);
      if (activeRoomRef.current) {
        const roomId = getRoomId(activeRoomRef.current);
        newSocket.emit("joinRoom", { roomId });
      }
    });

    newSocket.on("newMessage", (msg: Message) => {
      const currentRoomId = getRoomId(activeRoomRef.current);
      const msgRoomId = msg.roomId ? msg.roomId.toString() : "";
      if (currentRoomId && msgRoomId === currentRoomId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    newSocket.on("connect_error", (err) => {
      console.error("Connection error:", err);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Handle activeRoom selection changes (join room & load messages)
  useEffect(() => {
    if (activeRoom) {
      const roomId = getRoomId(activeRoom);
      fetchMessages(roomId);
      if (socket && socket.connected) {
        socket.emit("joinRoom", { roomId });
      }
    }
  }, [activeRoom, socket]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send Message
  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const roomId = getRoomId(activeRoom);
    if (!roomId) {
      toast.warning("Please select a study group first.");
      return;
    }
    if (!socket || !socket.connected) {
      toast.error("Chat server disconnected. Reconnecting...");
      return;
    }

    socket.emit("sendMessage", {
      roomId,
      content: inputText.trim(),
    });

    setInputText("");
  };

  // Create Group
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.warning("Group name cannot be blank.");
      return;
    }
    const participantEmails = participantInput
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(
        `${API_BASE_URL}/chat/rooms`,
        { name: groupName.trim(), participants: participantEmails },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Study group created successfully!");
      const newRoom = res.data;
      setRooms((prev) => [newRoom, ...prev]);
      setActiveRoom(newRoom);
      setGroupName("");
      setParticipantInput("");
      setShowCreateGroup(false);

      const roomId = getRoomId(newRoom);
      if (socket && socket.connected && roomId) {
        socket.emit("joinRoom", { roomId });
      }
    } catch (err) {
      toast.error("Failed to create study group.");
    }
  };

  // File upload logic
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const roomId = getRoomId(activeRoom);
    if (!file || !roomId || !socket) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await axios.post(`${API_BASE_URL}/chat/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      socket.emit("sendMessage", {
        roomId,
        content: `Shared a file: ${res.data.name}`,
        attachmentUrl: res.data.url,
        attachmentName: res.data.name,
      });

      toast.success("Document uploaded successfully!");
    } catch (err) {
      toast.error("Failed to upload document attachment.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex bg-card border border-border rounded-xl shadow-lg h-[75vh] overflow-hidden">
          
          {/* ── Left Sidebar (Study Groups/Channels) ── */}
          <div className="w-1/3 border-r border-border flex flex-col h-full bg-card/60">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-extrabold text-foreground flex items-center gap-1.5 text-sm md:text-base">
                <Users className="h-4.5 w-4.5 text-primary" /> Study Groups
              </h3>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all"
                title="Create Study Group"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {isRoomsLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="p-3 border border-border/40 rounded-lg flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : rooms.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center mt-10">No study groups. Create one above!</p>
              ) : (
                rooms.map((room) => {
                  const rId = getRoomId(room);
                  const isSelected = getRoomId(activeRoom) === rId;
                  return (
                    <button
                      key={rId}
                      onClick={() => setActiveRoom(room)}
                      className={`w-full text-left p-3.5 rounded-lg border transition-all flex items-center justify-between ${
                        isSelected
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:bg-muted/40 text-foreground"
                      }`}
                    >
                    <div>
                      <h4 className="font-bold text-xs md:text-sm truncate max-w-[150px]">{room.name}</h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{room.participants.length} members</p>
                    </div>
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground/60" />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Right Pane (Chat Viewport) ── */}
          <div className="flex-1 flex flex-col h-full bg-card/10">
            {activeRoom ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-foreground text-sm md:text-base">{activeRoom.name}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Secure 128-bit AES Encrypted Channel</p>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                  {isMessagesLoading ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className={`flex gap-3 max-w-[70%] ${idx % 2 === 0 ? "mr-auto" : "ml-auto flex-row-reverse"}`}>
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-14 w-48 rounded-xl" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center">
                      <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-2" />
                      <p className="text-xs">This is the start of your secure chat history.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderEmail === user?.email;
                      return (
                        <div
                          key={msg._id}
                          className={`flex flex-col max-w-[70%] ${
                            isMe ? "ml-auto items-end" : "mr-auto items-start"
                          }`}
                        >
                          <span className="text-[10px] text-muted-foreground mb-1">
                            {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          
                          <div
                            className={`p-3.5 rounded-2xl text-xs md:text-sm font-medium leading-relaxed ${
                              isMe
                                ? "bg-primary text-white rounded-tr-none shadow-md shadow-primary/10"
                                : "bg-card border border-border text-foreground rounded-tl-none shadow-sm"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>

                            {/* Document attachment card */}
                            {msg.attachmentUrl && (
                              <a
                                href={`${API_BASE_URL}${msg.attachmentUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-3.5 flex items-center justify-between p-2.5 bg-background/50 border border-border rounded-lg text-[11px] text-foreground hover:bg-background/80 transition-colors"
                              >
                                <span className="flex items-center gap-1.5 max-w-[150px] truncate">
                                  <FileText className="h-4 w-4 text-primary" /> {msg.attachmentName}
                                </span>
                                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Send footer */}
                <div className="p-4 border-t border-border bg-muted/10 flex gap-2 items-center">
                  {/* File Upload trigger */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.zip,.png,.jpg,.jpeg"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="p-2 border border-border rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PlusCircle className="h-4.5 w-4.5" />
                    )}
                  </button>

                  <input
                    type="text"
                    placeholder="Type a secure message..."
                    className="flex-1 bg-background border border-border text-foreground text-xs md:text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendMessage();
                    }}
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2.5 bg-primary text-white rounded-lg hover:bg-primary/95 transition-all shadow-sm flex items-center justify-center"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center">
                <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-base font-bold text-foreground">Select a Study Group</h3>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  Choose a study channel from the left menu or click "+" to configure a new group workspace.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Create Study Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-lg relative p-6 text-left flex flex-col gap-4">
            <h3 className="font-extrabold text-base text-foreground">Create Study Group</h3>
            
            <div className="flex flex-col gap-3.5">
              <div>
                <label className="text-[10px] text-muted-foreground font-semibold">Group Name</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 bg-background border border-border text-foreground rounded-lg text-xs focus:outline-none"
                  placeholder="e.g. Physics Final Study Session"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-semibold">Participant Emails (comma separated)</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 bg-background border border-border text-foreground rounded-lg text-xs focus:outline-none"
                  placeholder="student1@cloudedtech.com, student2@cloudedtech.com"
                  value={participantInput}
                  onChange={(e) => setParticipantInput(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-2">
              <button
                onClick={() => setShowCreateGroup(false)}
                className="px-4 py-2 border border-border text-xs rounded-lg hover:bg-muted font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                className="px-4 py-2 bg-primary text-white text-xs rounded-lg hover:bg-primary/95 font-medium shadow-sm"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
