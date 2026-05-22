import { useOutlet, Link, useLocation, useNavigate, useParams } from "react-router";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  User as UserIcon,
  Users,
  AlertOctagon,
  X,
  CheckSquare,
  MessageSquare,
  FolderOpen,
  Calendar as CalendarIcon,
  LayoutDashboard,
  FolderKanban,
  LogOut,
  Bell
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { projectApi } from "../api/projectApi";
import { notificationApi, Notification } from "../api/notificationApi";
import { useChat } from '../context/ChatContext';
import Avatar from './Avatar';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { totalUnreadCount, notificationCount, clearNotifications } = useChat();
  const { projectId } = useParams();
  const element = useOutlet();

  // Kicked Alerts State
  const [kickedAlerts, setKickedAlerts] = useState<{projectId: number, projectName: string, kickReason: string}[]>([]);

  // Notifications State
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchAlerts = async () => {
      try {
        const alerts = await projectApi.getKickedAlerts();
        setKickedAlerts(alerts);
      } catch (error) {}
    };

    const fetchNotifications = async () => {
      try {
        const notis = await notificationApi.getNotifications();
        const unread = notis.filter(n => !n.isRead).length;
        setUnreadNotificationsCount(unread);
      } catch (error) {}
    };

    fetchAlerts();
    fetchNotifications();
  }, [user]);

  // 소켓 실시간 알림 이벤트 발생 시 알림 목록 갱신
  useEffect(() => {
    if (notificationCount > 0) {
      const fetchNotifications = async () => {
        try {
          const notis = await notificationApi.getNotifications();
          const unread = notis.filter(n => !n.isRead).length;
          setUnreadNotificationsCount(unread);
        } catch (error) {}
      };
      fetchNotifications();
      clearNotifications(); // 컨텍스트의 카운트 초기화 (DB 동기화 완료)
    }
  }, [notificationCount, clearNotifications]);

  const handleAckAlert = async (projectId: number) => {
    try {
      await projectApi.ackKickedAlert(projectId);
      setKickedAlerts(prev => prev.filter(a => a.projectId !== projectId));
    } catch (e) {
      alert("알림 확인 처리에 실패했습니다.");
    }
  };

  const navItems = [
    { key: 'home', label: '홈', icon: FolderKanban, path: '/', active: location.pathname === '/' || location.pathname.startsWith('/projects') },
    { key: 'calendar', label: '일정', icon: CalendarIcon, path: '/calendar', active: location.pathname === '/calendar' },
    { key: 'mypage', label: '내 정보', icon: UserIcon, path: '/mypage', active: location.pathname.startsWith('/mypage') },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (item: any) => {
    const p = location.pathname;
    const search = location.search;

    // Project tabs
    if (projectId) {
      const tab = new URLSearchParams(search).get("tab") || "overview";
      return item.key === tab;
    }

    // Global tabs
    if (item.key === "home") return p === "/" || (p.startsWith("/projects") && !projectId);
    if (item.key === "calendar") return p.startsWith("/calendar");
    if (item.key === "mypage") return p.startsWith("/mypage");
    return false;
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--theme-bg)] dark:bg-[var(--theme-bg-gradient)] transition-all duration-500 overflow-hidden">
      {/* Top Bar - Slimmer for Mobile */}
      {/* Global Top Bar - Always visible */}
      <header className="bg-white/95 dark:bg-[#151C31]/90 backdrop-blur-2xl border-b border-gray-100 dark:border-white/10 px-6 py-4 flex-shrink-0 sticky top-0 z-50 transition-all duration-300">
          <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 cursor-pointer active:scale-95 transition-transform duration-200" onClick={() => navigate("/")}>
                <div className="w-9 h-9 bg-[#11B886] rounded-[10px] flex items-center justify-center text-white font-black shadow-lg shadow-[#11B886]/20">
                  <Users className="w-5 h-5" />
                </div>
                <h1 className="text-lg font-black text-[#1A2340] dark:text-white tracking-tight">Teampl</h1>
              </div>

              {/* Desktop Global Navigation */}
              <nav className="flex items-center gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.key}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        active
                          ? "bg-[#11B886]/10 text-[#11B886]"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-white/60 dark:hover:text-white"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/notifications')}
                  className="relative p-2.5 text-[#7D879C]/80 hover:text-[#11B886] bg-gray-100/50 dark:bg-white/5 active:scale-90 rounded-2xl transition-all"
                  title="알림 센터"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotificationsCount > 0 && (
                    <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#151C31] shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse"></div>
                  )}
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2.5 text-[#7D879C]/80 hover:text-red-500 bg-gray-100/50 dark:bg-white/5 active:scale-90 rounded-2xl transition-all"
                  title="로그아웃"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-3 border-l border-gray-200 dark:border-white/10 pl-4 ml-2">
                <div className="text-right">
                  <p className="text-[13px] font-black text-[#1A2340] dark:text-white leading-none mb-1">{user?.name}</p>
                  <p className="text-[10px] font-bold text-[#7D879C]/80 dark:text-white/40 uppercase tracking-widest">{user?.department}</p>
                </div>
                <Avatar 
                  name={user?.name} 
                  avatarUrl={user?.avatarUrl} 
                  shape="squircle"
                  className="cursor-pointer shadow-sm"
                  onClick={() => navigate('/mypage')}
                />
              </div>
            </div>
          </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrolling-touch relative">
        <div className={`${!projectId ? 'max-w-7xl mx-auto px-6 py-6 h-full' : 'w-full h-full'}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full h-full"
            >
              {element}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Global Kicked Alert Modal */}
      <AnimatePresence>
        {kickedAlerts.length > 0 && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#132038] w-full max-w-sm rounded-[24px] shadow-2xl border border-red-500/20 overflow-hidden"
            >
              <div className="bg-red-50 dark:bg-red-500/10 p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <AlertOctagon className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black text-[#1A2340] dark:text-red-400 mb-2">프로젝트 강퇴 알림</h2>
                <p className="text-sm font-bold text-[#7D879C] dark:text-white/60">
                  다음 프로젝트에서 팀장에 의해 내보내졌습니다.
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/10">
                  <p className="text-xs font-bold text-[#7D879C] uppercase tracking-wider mb-1">프로젝트명</p>
                  <p className="text-base font-black text-[#1A2340] dark:text-white truncate">
                    {kickedAlerts[0].projectName}
                  </p>
                </div>
                
                <div className="bg-red-50 dark:bg-red-500/5 rounded-2xl p-4 border border-red-100 dark:border-red-500/10">
                  <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">내보내진 사유</p>
                  <p className="text-sm font-medium text-red-600 dark:text-red-300">
                    {kickedAlerts[0].kickReason}
                  </p>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => handleAckAlert(kickedAlerts[0].projectId)}
                    className="w-full py-4 bg-[#1A2340] dark:bg-white text-white dark:text-[#132038] font-black rounded-2xl transition-all shadow-lg active:scale-95 hover:bg-black dark:hover:bg-gray-100"
                  >
                    확인 및 닫기
                  </button>
                  <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">안내를 확인하면 해당 알림은 완전히 삭제됩니다.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}