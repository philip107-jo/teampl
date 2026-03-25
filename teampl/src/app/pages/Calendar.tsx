import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { projectApi, Project } from "../api/projectApi";

export default function Calendar() {
  const { user } = useAuth();
  const isTestUser = user?.isTestUser;

  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 12)); // March 12, 2026
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    projectApi.getProjects().then(setProjects).catch(console.error);
  }, []);

  const mockEvents = isTestUser ? [
    {
      id: 1,
      title: "ERD 다이어그램 제출",
      project: "데이터베이스 설계",
      date: "2026-03-12",
      type: "deadline",
      color: "bg-red-500",
      dot: "bg-red-500",
    },
    {
      id: 2,
      title: "UI 프로토타입 리뷰 미팅",
      project: "모바일 앱 개발",
      date: "2026-03-13",
      type: "meeting",
      color: "bg-blue-500",
      dot: "bg-blue-500",
    },
    {
      id: 3,
      title: "웹 서비스 최종 발표",
      project: "웹 서비스 기획",
      date: "2026-03-15",
      type: "presentation",
      color: "bg-purple-500",
      dot: "bg-purple-500",
    },
    {
      id: 4,
      title: "중간 발표 자료 제출",
      project: "데이터베이스 설계",
      date: "2026-03-16",
      type: "deadline",
      color: "bg-red-500",
      dot: "bg-red-500",
    },
    {
      id: 5,
      title: "데이터셋 전처리 완료",
      project: "AI 모델 구현",
      date: "2026-03-15",
      type: "milestone",
      color: "bg-green-500",
      dot: "bg-green-500",
    },
  ] : [];

  const projectEvents = projects.map(p => {
    return {
      id: `proj-${p.id}`,
      title: p.name,
      project: p.course,
      startDate: p.createdAt || "2026-03-01",
      endDate: p.deadline.replace(/\./g, '-'),
      type: "project_span",
      color: p.color,
      iconColor: p.iconColor,
      dot: p.color
    };
  });

  const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { daysInMonth: lastDay.getDate(), startingDayOfWeek: firstDay.getDay() };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getEventsForDate = (day: number | null) => {
    if (!day) return [];
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const matchingMocks = mockEvents.filter((event) => event.date === dateStr).map(e => ({
      ...e,
      isHex: e.color?.startsWith('#'),
      isSpan: false,
      isSpanStart: false,
      isSpanEnd: false
    }));

    const spanEvents = projectEvents.filter(p => dateStr >= p.startDate && dateStr <= p.endDate).map(p => ({
      id: `${p.id}-${dateStr}`,
      title: p.title,
      project: p.project,
      color: p.color,
      isHex: p.color?.startsWith('#'),
      isSpan: true,
      isSpanStart: dateStr === p.startDate,
      isSpanEnd: dateStr === p.endDate
    }));

    return [...matchingMocks, ...spanEvents];
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date(2026, 2, 12);
    return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  };

  const upcomingEvents = mockEvents
    .filter((event) => new Date(event.date) >= new Date(2026, 2, 12))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(e => ({ ...e, isHex: e.color?.startsWith('#') }))
    .slice(0, 5);

  const activeProjectDeadlines = projectEvents
    .filter(p => new Date(p.endDate) >= new Date(2026, 2, 12))
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .map(p => ({
      id: p.id,
      title: p.title + " (프로젝트 진행중)",
      project: p.project,
      date: p.endDate,
      type: 'project_span',
      color: p.color,
      isHex: p.color?.startsWith('#')
    }))
    .slice(0, 5);

  const displayUpcoming = [...upcomingEvents, ...activeProjectDeadlines].slice(0, 5);

  return (
    <div className="space-y-6 p-4 pb-24 lg:max-w-4xl lg:mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">팀 일정</h1>
          <p className="text-sm text-gray-400 mt-1">프로젝트 마감일과 미팅을 관리하세요</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all">
          <Plus className="w-4 h-4" />
          일정 추가
        </button>
      </div>

      {/* Calendar Card */}
      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50 flex flex-col">
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
          </h2>
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((day, i) => (
            <div key={day} className={`text-center text-[11px] font-bold uppercase tracking-wider py-2 ${i === 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const today = isToday(day);
            return (
              <div
                key={index}
                className={`min-h-[80px] rounded-2xl p-2 relative transition-all group ${day ? "bg-white border border-gray-100 hover:border-indigo-200 cursor-pointer" : "bg-gray-50/50"
                  } ${today ? "ring-2 ring-indigo-500 ring-offset-2" : ""}`}
              >
                {day && (
                  <>
                    <span className={`text-sm font-bold ${today ? "text-indigo-600" : (index % 7 === 0 ? "text-red-400" : "text-gray-900")}`}>
                      {day}
                    </span>
                    <div className="flex flex-col gap-1 mt-1.5">
                      {dayEvents.map((event) => {
                        const isStart = !event.isSpan || event.isSpanStart || index % 7 === 0;
                        const isEnd = !event.isSpan || event.isSpanEnd || index % 7 === 6;

                        return (
                          <div
                            key={event.id}
                            className={`h-1.5 shadow-sm relative z-10 ${event.isHex ? '' : event.color} ${isStart ? 'rounded-l-full' : ''} ${isEnd ? 'rounded-r-full' : ''}`}
                            title={event.title}
                            style={{
                              ...(event.isHex ? { backgroundColor: event.color } : {}),
                              marginLeft: isStart ? 0 : '-11px',
                              marginRight: isEnd ? 0 : '-11px',
                            }}
                          ></div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 ml-1">다가오는 주요 일정</h2>
        {displayUpcoming.length > 0 ? (
          <div className="grid gap-4">
            {displayUpcoming.map((event) => (
              <div key={event.id} className="bg-white rounded-3xl p-5 border border-gray-50 shadow-sm flex items-center gap-5 hover:border-indigo-100 transition-all group">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg overflow-hidden relative ${event.isHex ? '' : event.color}`}>
                  {event.isHex && <div className="absolute inset-0" style={{ backgroundColor: event.color }}></div>}
                  <CalendarIcon className="w-6 h-6 relative z-10" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-base group-hover:text-indigo-600 transition-colors">{event.title}</h3>
                  <p className="text-xs text-gray-400 mt-1 font-medium">{event.project}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                      <Clock className="w-3 h-3" />
                      {event.date}
                    </div>
                    {event.type === 'deadline' && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                        <AlertCircle className="w-3 h-3" />
                        긴급
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[32px] p-10 shadow-sm border border-gray-50 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-[20px] flex items-center justify-center mb-4">
              <CalendarIcon className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-[15px] font-bold text-gray-900">예정된 주요 일정이 없습니다</p>
            <p className="text-[13px] text-gray-400 mt-1 font-medium">프로젝트 일정을 등록하여 마감일과 미팅을 관리해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}