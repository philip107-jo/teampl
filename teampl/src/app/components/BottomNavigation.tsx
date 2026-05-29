import { Link, useLocation, useParams } from "react-router";
import { FolderKanban, Calendar as CalendarIcon, User as UserIcon } from "lucide-react";
import { motion } from "motion/react";
import { useChat } from "../context/ChatContext";

export default function BottomNavigation() {
  const location = useLocation();
  const { projectId } = useParams();
  const { totalUnreadCount } = useChat();

  const navItems = [
    {
      key: "home",
      label: "홈",
      icon: FolderKanban,
      path: "/projects",
      active: location.pathname === "/" || location.pathname.startsWith("/projects"),
    },
    {
      key: "calendar",
      label: "일정",
      icon: CalendarIcon,
      path: "/calendar",
      active: location.pathname.startsWith("/calendar"),
    },
    {
      key: "mypage",
      label: "내 정보",
      icon: UserIcon,
      path: "/mypage",
      active: location.pathname.startsWith("/mypage"),
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-[#151C31]/90 backdrop-blur-2xl border-t border-gray-100 dark:border-white/10 px-4 pt-2 pb-safe-bottom shadow-[0_-4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.2)] transition-colors duration-300">
      <nav className="flex items-center justify-around max-w-md mx-auto h-12">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.active;

          return (
            <Link
              key={item.key}
              to={item.path}
              className="relative flex flex-col items-center justify-center flex-1 h-full py-1 text-center group active:scale-95 transition-transform duration-150"
            >
              <div
                className={`relative p-1 rounded-xl transition-all duration-300 ${
                  active
                    ? "text-[#11B886]"
                    : "text-gray-400 dark:text-white/40 group-hover:text-gray-600 dark:group-hover:text-white/60"
                }`}
              >
                <Icon className="w-5 h-5 transition-transform duration-300 group-active:scale-90" />
              </div>
              <span
                className={`text-[10px] font-black tracking-tight mt-0.5 transition-all duration-300 ${
                  active
                    ? "text-[#11B886] font-extrabold scale-105"
                    : "text-gray-400 dark:text-white/40"
                }`}
              >
                {item.label}
              </span>

              {/* Slide Active Indicator bar */}
              {active && (
                <motion.div
                  layoutId="bottom-nav-active-bar"
                  className="absolute bottom-0 w-8 h-[3px] bg-[#11B886] rounded-t-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
