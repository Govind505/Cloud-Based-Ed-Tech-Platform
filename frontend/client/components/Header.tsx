import { Link, useLocation } from "react-router-dom";
import { Menu, X, Play } from "lucide-react";
import { useState, useEffect } from "react";
import SearchBar from "./SearchBar";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Dashboard", path: "/dashboard", protected: true },
    { name: "LMS", path: "/lms", protected: true },
    { name: "Live Classes", path: "/live-classes", protected: true },
    { name: "Student Discussion", path: "/chat", protected: true },
    { name: isAuthenticated ? "Back to Home" : "Home", path: "/" },
  ];

  const filteredLinks = navLinks.filter((link) => {
    if (!isAuthenticated) return !link.protected;
    if (user?.role?.toUpperCase() === "ADMIN") {
      return link.name === "Home" || link.name === "Back to Home" || link.name === "Dashboard";
    }
    return true;
  });

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-md border-b border-border py-2"
          : "bg-gradient-to-b from-black/60 to-transparent py-4"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          {/* Left: Logo & Nav */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                <Play className="h-5 w-5 text-primary-foreground fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                  CloudEdTech
                </span>
              </div>
            </Link>

            {/* Real-time System Online Beacon */}
            <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              SYSTEM ONLINE
            </div>

            <nav className="hidden lg:flex items-center gap-1.5 ml-2">
              {filteredLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      isActive
                        ? "text-white bg-primary/15 shadow-sm border border-primary/20"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:block">
              <SearchBar />
            </div>
            <NotificationBell />
            
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth" className="hidden sm:block">
                  <Button variant="ghost" className="text-zinc-400 hover:text-white">
                    Log in
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-full px-6">
                    Join Now
                  </Button>
                </Link>
              </div>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-zinc-400 hover:text-white"
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden bg-card/50 backdrop-blur-xl rounded-2xl mt-4 border border-border"
            >
              <div className="flex flex-col p-4 gap-2">
                {filteredLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-xl text-base font-medium ${
                      location.pathname === link.path
                        ? "text-primary bg-primary/10"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
                {!isAuthenticated && (
                  <Link to="/auth" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full mt-2 bg-primary">Get Started</Button>
                  </Link>
                )}
                <div className="md:hidden mt-4 pt-4 border-t border-border">
                  <SearchBar />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
