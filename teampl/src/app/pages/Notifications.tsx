import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Bell, CheckCircle2, MessageSquare, AlertCircle, Calendar as CalendarIcon, FileText, Check } from "lucide-react";

export default function Notifications() {
  const { user } = useAuth();
  const isTestUser = user?.isTestUser;

  const [activeTab, setActiveTab] = useState("전체");

  const notifications = isTestUser ? [
    {
      id: 1,
      type: "mention",
      title: "김철수님이 나를 언급했습니다.",
      content: "데이터베이스 설계 프로젝트: ERD 초안 리뷰 부탁드립니다.",
      time: "10분 전",
      isRead: false,
      icon: MessageSquare,
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      id: 2,
      type: "task",
      title: "새로운 업무가 할당되었습니다.",
      content: "모바일 앱 개발: 로그인 화면 UI 프로토타입 작성",
      time: "1시간 전",
      isRead: false,
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      id: 3,
      type: "alert",
      title: "마감일 알림",
      content: "AI 모델 구현: 데이터셋 전처리 완료 마감이 내일입니다.",
      time: "어제",
      isRead: true,
      icon: AlertCircle,
      color: "text-red-500",
      bg: "bg-red-50",
    },
    {
      id: 4,
      type: "calendar",
      title: "일정 변경 안내",
      content: "웹 서비스 기획: 주간 회의 시간이 오후 2시로 변경되었습니다.",
      time: "어제",
      isRead: true,
      icon: CalendarIcon,
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
    {
      id: 5,
      type: "file",
      title: "새 파일 업로드",
      content: "이영희님이 '요구사항_정의서_v2.pdf'를 업로드했습니다.",
      time: "2일 전",
      isRead: true,
      icon: FileText,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
    },
  ] : [];

  const filteredNotis = activeTab === "전체"
    ? notifications
    : activeTab === "안 읽음"
      ? notifications.filter(n => !n.isRead)
      : notifications.filter(n => n.type === activeTab);

  return (
    <div className="p-6 md:p-8 space-y-6 bg-[#f8faff] min-h-screen pb-24 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-gray-400 text-[14px] font-bold">새로운 소식</p>
          <h1 className="text-[28px] font-black text-gray-900 tracking-tight flex items-center gap-3">
            알림 센터
            <span className="flex items-center justify-center w-7 h-7 bg-red-500 text-white text-[13px] rounded-full shadow-lg shadow-red-200">
              {notifications.filter(n => !n.isRead).length}
            </span>
          </h1>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-[14px] font-bold hover:bg-gray-50 transition-all shadow-sm">
          <Check className="w-4 h-4" />
          모두 읽음
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
        {["전체", "안 읽음", "mention", "task"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-xl text-[14px] font-bold whitespace-nowrap transition-all ${activeTab === tab
                ? "bg-[#6366f1] text-white shadow-lg shadow-indigo-100"
                : "bg-white text-gray-400 border border-gray-100 hover:bg-gray-50"
              }`}
          >
            {tab === "mention" ? "멘션" : tab === "task" ? "업무" : tab}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] overflow-hidden">
        {filteredNotis.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {filteredNotis.map((noti) => (
              <div
                key={noti.id}
                className={`p-5 hover:bg-gray-50 transition-colors flex gap-4 cursor-pointer relative ${!noti.isRead ? "bg-indigo-50/30" : ""
                  }`}
              >
                {!noti.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r-lg"></div>
                )}

                <div className={`w-12 h-12 rounded-2xl ${noti.bg} flex items-center justify-center flex-shrink-0 mt-1`}>
                  {<noti.icon className={`w-6 h-6 ${noti.color}`} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className={`text-[16px] truncate ${!noti.isRead ? "font-black text-gray-900" : "font-bold text-gray-700"}`}>
                      {noti.title}
                    </h3>
                    <span className="text-[12px] font-bold text-gray-400 whitespace-nowrap">
                      {noti.time}
                    </span>
                  </div>
                  <p className="text-[14px] text-gray-500 font-medium leading-relaxed">
                    {noti.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-[18px] font-black text-gray-900 mb-2">새로운 알림이 없습니다</p>
            <p className="text-[14px] font-bold text-gray-400">팀원들이 보내는 소식이 이곳에 표시됩니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
