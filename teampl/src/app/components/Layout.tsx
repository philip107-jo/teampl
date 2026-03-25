import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Calendar as CalendarIcon,
  MessageSquare,
  Bell,
  LogOut,
  User as UserIcon,
  HardDrive
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "홈" },
    { path: "/projects", icon: FolderKanban, label: "프로젝트" },
    { path: "/tasks", icon: CheckSquare, label: "할 일" },
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
    <div className="flex flex-col h-screen bg-[#f8faff]">
      {/* Top Bar - Mobile */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex-shrink-0 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold rotate-3">T</div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight transition-all">TeamSync</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block mr-1">
              <p className="text-xs font-bold text-gray-900">{user?.name}</p>
              <p className="text-[10px] text-gray-400">{user?.department}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="로그아웃"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-auto pb-20 relative">
        <div key={location.pathname} className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full min-h-full">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 flex-shrink-0 z-50">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${active
                  ? "text-indigo-600"
                  : "text-gray-500"
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}