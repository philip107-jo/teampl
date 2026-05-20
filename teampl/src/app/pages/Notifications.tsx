import { useState, useEffect } from "react";
import { Bell, CheckCircle2, MessageSquare, AlertCircle, Calendar as CalendarIcon, FileText, Check, Loader2 } from "lucide-react";
import { notificationApi, Notification } from "../api/notificationApi";

export default function Notifications() {
  const [activeTab, setActiveTab] = useState("전체");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const data = await notificationApi.getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const filteredNotis = activeTab === "전체" 
    ? notifications 
    : activeTab === "안 읽음" 
      ? notifications.filter(n => !n.isRead) 
      : notifications.filter(n => n.type === activeTab);

  const tabs = ["전체", "안 읽음", "task", "mention"];

  const getIconAndTheme = (type: string) => {
    switch (type) {
      case 'task': return { icon: CheckCircle2, theme: 'green' };
      case 'mention': return { icon: MessageSquare, theme: 'purple' };
      case 'alert': return { icon: AlertCircle, theme: 'red' };
      default: return { icon: Bell, theme: 'blue' };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-[#12182B] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#11B886]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#12182B]">
      {/* Header */}
      <div className="px-4 py-4 md:px-8 md:py-6 border-b border-gray-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 bg-white/95 dark:bg-[#12182B]/95 backdrop-blur-xl z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-900 dark:text-white">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-[#1A2340] dark:text-white tracking-tight">알림 센터</h1>
            <p className="text-sm font-bold text-[#7D879C] mt-1">새로운 소식과 업데이트를 확인하세요.</p>
          </div>
        </div>
        <button 
          onClick={handleMarkAllAsRead}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold text-[#1A2340] dark:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors active:scale-95"
        >
          <Check className="w-4 h-4" />
          모두 읽음 처리
        </button>
      </div>

      {/* Tabs */}
      <div className="px-4 md:px-8 py-3 border-b border-gray-100 dark:border-white/5 overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-[#11B886] text-white shadow-md shadow-[#11B886]/20"
                  : "bg-gray-50 dark:bg-white/5 text-[#7D879C] hover:text-[#1A2340] dark:hover:text-white"
              }`}
            >
              {tab === 'task' ? '업무' : tab === 'mention' ? '멘션' : tab}
              {tab === "안 읽음" && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-3">
          {filteredNotis.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-400 mb-4">
                <Bell className="w-8 h-8 opacity-50" />
              </div>
              <h3 className="text-[15px] font-bold text-[#1A2340] dark:text-white">새로운 알림이 없습니다</h3>
              <p className="text-sm text-[#7D879C] mt-1">모든 소식을 확인하셨습니다.</p>
            </div>
          ) : (
            filteredNotis.map((noti) => {
              const { icon: Icon, theme } = getIconAndTheme(noti.type);
              
              const themeColors = {
                purple: "bg-[#7C6CFF]/10 text-[#7C6CFF] border-[#7C6CFF]/20",
                green: "bg-[#11B886]/10 text-[#11B886] border-[#11B886]/20",
                red: "bg-red-500/10 text-red-500 border-red-500/20",
                orange: "bg-orange-500/10 text-orange-500 border-orange-500/20",
                blue: "bg-blue-500/10 text-blue-500 border-blue-500/20",
              };
              const colorClass = themeColors[theme as keyof typeof themeColors];

              return (
                <div 
                  key={noti.id}
                  onClick={() => handleMarkAsRead(noti.id)}
                  className={`group relative p-4 md:p-5 rounded-2xl border transition-all cursor-pointer ${
                    !noti.isRead 
                      ? "bg-white dark:bg-[#151C31] border-transparent shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]" 
                      : "bg-gray-50/50 dark:bg-[#0d1526] border-gray-100 dark:border-white/5 opacity-70"
                  }`}
                >
                  <div className="flex gap-4 items-start">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-4 mb-1">
                        <h3 className={`text-[15px] font-black truncate ${!noti.isRead ? "text-[#1A2340] dark:text-white" : "text-[#1A2340]/70 dark:text-white/70"}`}>
                          {noti.title}
                        </h3>
                        <span className="text-xs font-bold text-[#7D879C] whitespace-nowrap">
                          {new Date(noti.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`text-sm leading-relaxed ${!noti.isRead ? "text-gray-600 dark:text-gray-300 font-bold" : "text-gray-500 dark:text-gray-400 font-medium"}`}>
                        {noti.content}
                      </p>
                    </div>

                    {!noti.isRead && (
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 mt-2 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
