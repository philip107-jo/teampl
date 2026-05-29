import { useOutlet, Link, useLocation, useNavigate, useParams } from "react-router";
import { useState, useEffect, useCallback } from "react";
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
  Bell,
  Search
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { projectApi } from "../api/projectApi";
import { notificationApi, Notification } from "../api/notificationApi";
import { useChat } from '../context/ChatContext';
import Avatar from './Avatar';
import { useRef } from 'react';
import { TEAMPL_LOGO_URL } from "../constants/assets";
import BottomNavigation from './BottomNavigation';

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

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ messages: [], tasks: [], files: [] });
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!projectId || !searchQuery.trim()) {
       setSearchResults({ messages: [], tasks: [], files: [] });
       return;
    }
    const timer = setTimeout(() => {
      setIsSearching(true);
      projectApi.searchProject(Number(projectId), searchQuery)
        .then((res: any) => setSearchResults(res))
        .finally(() => setIsSearching(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, projectId]);

  const fetchNotifications = useCallback(async () => {
    try {
      const notis = await notificationApi.getNotifications();
      const unread = notis.filter(n => !n.isRead).length;
      setUnreadNotificationsCount(unread);
    } catch (error) {
      console.error("알림을 가져오는 데 실패했습니다", error);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchAlerts = async () => {
      try {
        const alerts = await projectApi.getKickedAlerts();
        setKickedAlerts(alerts);
      } catch (error) {
        console.error("강퇴 알림을 가져오는 데 실패했습니다", error);
      }
    };

    fetchAlerts();
    fetchNotifications();
  }, [user, fetchNotifications]);

  // 소켓 실시간 알림 이벤트 발생 시 알림 목록 갱신
  useEffect(() => {
    if (notificationCount > 0) {
      fetchNotifications();
      clearNotifications(); // 컨텍스트의 카운트 초기화 (DB 동기화 완료)
    }
  }, [notificationCount, clearNotifications, fetchNotifications]);

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
      <header className="bg-white/95 dark:bg-[#151C31]/90 backdrop-blur-2xl border-b border-gray-100 dark:border-white/10 px-4 md:px-6 py-2.5 md:py-4 flex-shrink-0 sticky top-0 z-50 transition-all duration-300">
          <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3 cursor-pointer active:scale-95 transition-transform duration-200" onClick={() => navigate("/")}>
                <img 
                  src={TEAMPL_LOGO_URL} 
                  onError={(e) => { e.currentTarget.src = "/logo.png"; }}
                  alt="Teampl Logo" 
                  className="w-10 h-10 md:w-[52px] md:h-[52px] object-contain"
                />
                <h1 className="text-lg md:text-xl font-black text-[#1A2340] dark:text-white tracking-tight">Teampl</h1>
              </div>

              {/* Desktop Global Navigation */}
              <nav className="hidden md:flex items-center gap-1">
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
              {/* Global Project Search Bar - Only show when inside a project */}
              {projectId && (
                <div className="relative hidden md:block" ref={searchRef}>
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3" />
                    <input 
                      type="text" 
                      placeholder="통합 검색 (채팅, 업무, 자료)..." 
                      className="pl-9 pr-4 py-2 w-[240px] bg-gray-100 dark:bg-white/5 border-transparent focus:border-[#11B886] focus:bg-white dark:focus:bg-[#0d1526] rounded-full text-sm outline-none transition-all dark:text-white"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {/* Search Results Dropdown */}
                  {searchQuery.trim() && (
                    <div className="absolute right-0 top-12 w-[350px] max-h-[400px] overflow-y-auto bg-white dark:bg-[#132038] rounded-xl shadow-xl border border-gray-100 dark:border-white/10 z-50 p-2 text-sm">
                      {isSearching ? (
                        <div className="p-4 text-center text-gray-500">검색 중...</div>
                      ) : (
                        <>
                          {searchResults.tasks.length > 0 && (
                            <div className="mb-2">
                              <h4 className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase">할 일</h4>
                              {searchResults.tasks.map((t: any) => (
                                <div key={t.id} onClick={() => { setSearchQuery(""); navigate(`/projects/${projectId}?tab=tasks`); }} className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg cursor-pointer">
                                  <p className="font-bold text-[#1A2340] dark:text-white truncate">{t.title}</p>
                                  <p className="text-xs text-gray-500 truncate">{t.description}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {searchResults.messages.length > 0 && (
                            <div className="mb-2">
                              <h4 className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase">메시지</h4>
                              {searchResults.messages.map((m: any) => (
                                <div key={m.id} onClick={() => { setSearchQuery(""); navigate(`/projects/${projectId}?tab=chat`); }} className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg cursor-pointer">
                                  <p className="font-bold text-[#1A2340] dark:text-white">{m.sender.name}</p>
                                  <p className="text-xs text-gray-500 truncate">{m.content}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {searchResults.files.length > 0 && (
                            <div>
                              <h4 className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase">자료</h4>
                              {searchResults.files.map((f: any) => (
                                <div key={f.id} onClick={() => { setSearchQuery(""); navigate(`/projects/${projectId}?tab=drive`); }} className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg cursor-pointer flex items-center gap-2">
                                  <FolderOpen className="w-4 h-4 text-gray-400" />
                                  <p className="font-bold text-[#1A2340] dark:text-white truncate">{f.name}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {searchResults.tasks.length === 0 && searchResults.messages.length === 0 && searchResults.files.length === 0 && (
                            <div className="p-4 text-center text-gray-500">검색 결과가 없습니다.</div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
              
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
              
              <div className="flex items-center gap-3 border-l border-gray-200 dark:border-white/10 pl-2 md:pl-4 ml-1 md:ml-2">
                <div className="hidden sm:block text-right">
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
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrolling-touch relative pb-16 md:pb-0">
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
      <BottomNavigation />
    </div>
  );
}