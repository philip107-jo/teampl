import { useState } from "react";
import { Bell, CheckCircle2, MessageSquare, AlertCircle, Calendar as CalendarIcon, FileText, Check } from "lucide-react";

export default function Notifications() {
  const [activeTab, setActiveTab] = useState("전체");

  const notifications = [
    {
      id: 1,
      type: "mention",
      title: "김철수님이 나를 언급했습니다.",
      content: "데이터베이스 설계 프로젝트: ERD 초안 리뷰 부탁드립니다.",
      time: "10분 전",
      isRead: false,
      icon: MessageSquare,
      theme: "purple"
    },
    {
      id: 2,
      type: "task",
      title: "새로운 업무가 할당되었습니다.",
      content: "모바일 앱 개발: 로그인 화면 UI 프로토타입 작성",
      time: "1시간 전",
      isRead: false,
      icon: CheckCircle2,
      theme: "green"
    },
    {
      id: 3,
      type: "alert",
      title: "마감일 알림 (긴급)",
      content: "AI 모델 구현: 데이터셋 전처리 완료 마감이 내일입니다.",
      time: "어제",
      isRead: true,
      icon: AlertCircle,
      theme: "red"
    },
    {
      id: 4,
      type: "calendar",
      title: "일정 변경 안내",
      content: "웹 서비스 기획: 주간 회의 시간이 오후 2시로 변경되었습니다.",
      time: "어제",
      isRead: true,
      icon: CalendarIcon,
      theme: "orange"
    },
    {
      id: 5,
      type: "file",
      title: "새 파일 업로드",
      content: "이영희님이 '요구사항_정의 정의서_v2.pdf'를 업로드했습니다.",
      time: "2일 전",
      isRead: true,
      icon: FileText,
      theme: "blue"
    },
  ];

  const filteredNotis = activeTab === "전체" 
    ? notifications 
    : activeTab === "안 읽음" 
      ? notifications.filter(n => !n.isRead) 
      : notifications.filter(n => n.type === activeTab);

  return (
    <div className="dashboard pt-4 lg:max-w-4xl lg:mx-auto">
      {/* Header */}
      <section className="card hero-card mb-6">
        <div className="hero-top" style={{ alignItems: 'flex-end', marginBottom: 0 }}>
          <div>
            <p className="hero-meta uppercase">알림 피드</p>
            <h1 className="hero-title flex items-center gap-4" style={{ fontSize: '2rem' }}>
              알림 센터
              <span className="flex items-center justify-center min-w-[32px] h-[32px] px-2.5 bg-[#FF6B7A] text-white text-[13px] font-black rounded-[10px] shadow-[0_0_15px_rgba(255,107,122,0.4)] border border-[#FF6B7A]/50">
                {notifications.filter(n => !n.isRead).length}
              </span>
            </h1>
          </div>
          <button className="flex items-center gap-3 px-6 py-3.5 bg-white/50 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-[#7D879C] dark:text-white/60 rounded-[20px] text-[13px] font-black uppercase tracking-widest hover:bg-white/60 dark:bg-white/10 hover:text-[#1A2340] dark:text-white transition-all shadow-sm active:scale-95 group">
            <Check className="w-4 h-4 group-hover:scale-110 transition-transform" />
            모두 읽음
          </button>
        </div>
      </section>

      {/* Filter Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide mb-6 relative z-10">
        {["전체", "안 읽음", "mention", "task"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-[20px] text-[12px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab
                ? "bg-[#7C6CFF] text-white shadow-[0_0_20px_rgba(124,108,255,0.4)] border border-[#7C6CFF]/40"
                : "bg-white dark:bg-[#12182B] text-[#7D879C]/80 dark:text-white/40 border border-gray-200 dark:border-white/5 hover:bg-white/50 dark:bg-white/5 hover:text-[#1A2340] dark:text-white"
            }`}
          >
            {tab === "mention" ? "멘션" : tab === "task" ? "업무" : tab}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-4 pb-24">
        {filteredNotis.length > 0 ? (
          <div className="space-y-4">
            {filteredNotis.map((noti) => (
              <div 
                key={noti.id} 
                className={`card !p-6 flex gap-6 cursor-pointer relative group transition-all !border-gray-200 dark:!border-white/5 ${
                  !noti.isRead ? "!bg-white/40 dark:!bg-[#1A2340] hover:!bg-white/50 dark:!bg-[#222E54]" : "hover:!bg-white/40 dark:!bg-[#1A2340]"
                }`}
              >
                {!noti.isRead && (
                  <div className="absolute left-0 top-6 bottom-6 w-1.5 rounded-r-lg bg-[#7C6CFF] shadow-[0_0_15px_rgba(124,108,255,0.6)]"></div>
                )}
                
                <div className={`schedule-item ${noti.theme} !p-0 !border-none bg-transparent flex-shrink-0`}>
                  <div className="schedule-icon" style={{ width: 64, height: 64, borderRadius: 16 }}>
                    <noti.icon className="w-8 h-8 text-[#1A2340] dark:text-white" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className={`text-[17px] tracking-tight truncate ${!noti.isRead ? "font-black text-[#1A2340] dark:text-white" : "font-black text-[#7D879C] dark:text-white/70"}`}>
                      {noti.title}
                    </h3>
                    <span className="text-[11px] font-black text-[#7D879C]/80 dark:text-white/40 uppercase tracking-widest whitespace-nowrap">
                      {noti.time}
                    </span>
                  </div>
                  <p className="text-[14px] text-[#7D879C] dark:text-white/60 font-medium leading-relaxed group-hover:text-white/90 transition-opacity">
                    {noti.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card !py-32 flex flex-col items-center justify-center text-center !border-gray-200 dark:!border-white/5">
            <div className={`schedule-item purple !p-0 !border-none bg-transparent mb-6 opacity-40`}>
              <div className="schedule-icon" style={{ width: 80, height: 80, borderRadius: 24 }}>
                <Bell className="w-10 h-10 text-[#1A2340] dark:text-white" />
              </div>
            </div>
            <p className="text-[20px] font-black text-[#1A2340] dark:text-white mb-2 uppercase tracking-tight">상태 확인 완료</p>
            <p className="hero-meta !text-[#7D879C]/80 dark:!text-white/40">새로운 알림이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
