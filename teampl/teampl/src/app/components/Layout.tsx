import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Calendar as CalendarIcon,
  MessageSquare,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "홈" },
    { path: "/projects", icon: FolderKanban, label: "프로젝트" },
    { path: "/chat", icon: MessageSquare, label: "채팅" },
    { path: "/calendar", icon: CalendarIcon, label: "일정" },
    { path: "/mypage", icon: UserIcon, label: "내 정보" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--theme-bg)] dark:bg-[var(--theme-bg-gradient)] transition-all duration-500 overflow-hidden">
      {/* Top Bar - Slimmer for Mobile */}
      <header className="bg-white/90 dark:bg-[#151C31]/40 backdrop-blur-2xl border-b border-gray-100 dark:border-white/10 px-4 py-3 md:py-4 flex-shrink-0 sticky top-0 z-50 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 active:scale-95 transition-transform duration-200" onClick={() => navigate("/")}>
            <div className="w-8 h-8 md:w-9 md:h-9 bg-indigo-600 rounded-[10px] flex items-center justify-center text-white font-black rotate-3 shadow-lg shadow-indigo-500/20">T</div>
            <h1 className="text-[17px] md:text-lg font-black text-[#1A2340] dark:text-white tracking-tight">TeamSync</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden xs:block mr-1">
              <p className="text-[13px] font-black text-[#1A2340] dark:text-white leading-none mb-1">{user?.name}</p>
              <p className="text-[10px] font-bold text-[#7D879C]/80 dark:text-white/40 uppercase tracking-widest">{user?.department}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 text-[#7D879C]/80 hover:text-red-500 bg-gray-100/50 dark:bg-white/5 active:scale-90 rounded-2xl transition-all"
              title="로그아웃"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Page Content - Optimized for momentum scrolling */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrolling-touch pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation - Mobile-First */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-[#12182B]/95 backdrop-blur-2xl border-t border-gray-200 dark:border-white/5 px-1 py-2 md:py-3 flex-shrink-0 z-50 transition-all duration-300 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1.5 px-2.5 py-2 rounded-2xl transition-all duration-300 active:scale-90 ${
                  active
                    ? "text-[#7C6CFF] drop-shadow-[0_0_8px_rgba(124,108,255,0.4)]"
                    : "text-[#7D879C]/80 dark:text-white/40 hover:text-[#1A2340] dark:hover:text-white"
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${active ? "bg-[#7C6CFF]/10" : "bg-transparent"}`}>
                  <Icon className={`w-[22px] h-[22px] md:w-6 md:h-6 transition-transform ${active ? "scale-110" : ""}`} />
                </div>
                <span className={`text-[10px] md:text-xs font-black uppercase tracking-tighter ${active ? "opacity-100" : "opacity-60"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}