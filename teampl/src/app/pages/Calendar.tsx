import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, AlertCircle, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import { projectApi } from "../api/projectApi";
import { scheduleApi } from "../api/scheduleApi";

interface CalendarProps {
  projectId?: number;
}

export default function Calendar({ projectId: propProjectId }: CalendarProps = {}) {
  const { user } = useAuth();
  const params = useParams<{ projectId: string }>();
  const numProjectId = propProjectId || Number(params.projectId);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [dragStart, setDragStart] = useState<string | null>(null);
  const [dragEnd, setDragEnd] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ title: '', project: '', date: '', endDate: '', type: 'other' });

  useEffect(() => {
    projectApi.getProjects()
      .then(data => setProjects(data))
      .catch(console.error);

    if (numProjectId) {
      scheduleApi.getSchedules(numProjectId)
        .then(data => setEvents(data))
        .catch(console.error);
    }

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [numProjectId, isDragging]);

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEventId) {
        const updatedEvent = await scheduleApi.updateSchedule(numProjectId, editingEventId, formData);
        setEvents(events.map(ev => ev.id === editingEventId ? updatedEvent : ev));
      } else {
        const newEvent = await scheduleApi.createSchedule(numProjectId, formData);
        setEvents([...events, newEvent]);
      }
      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEventId) return;
    try {
      await scheduleApi.deleteSchedule(numProjectId, editingEventId);
      setEvents(events.filter(ev => ev.id !== editingEventId));
      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEventId(null);
    setFormData({ title: '', project: '', date: '', endDate: '', type: 'other' });
  };

  const openAddModal = (startStr?: string, endStr?: string) => {
    const defaultDate = startStr || selectedDate;
    setFormData({ 
      title: '', 
      project: projects.length > 0 ? projects[0].name : '팀 전체 일정', 
      type: 'other', 
      date: defaultDate, 
      endDate: endStr || defaultDate 
    });
    setEditingEventId(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (event: any) => {
    setEditingEventId(event.id);
    setFormData({
      title: event.title,
      project: event.project,
      date: event.date,
      endDate: event.endDate || event.date,
      type: event.type
    });
    setIsModalOpen(true);
  };

  const handleMouseDown = (day: number | null) => {
    if (!day) return;
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setDragStart(dateStr);
    setDragEnd(dateStr);
    setIsDragging(true);
  };

  const handleMouseEnter = (day: number | null) => {
    if (!day || !isDragging) return;
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setDragEnd(dateStr);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDragging && dragStart && dragEnd) {
      if (dragStart !== dragEnd) {
        const start = new Date(dragStart).getTime();
        const end = new Date(dragEnd).getTime();
        const finalStart = start < end ? dragStart : dragEnd;
        const finalEnd = start < end ? dragEnd : dragStart;
        setSelectedDate(finalStart); 
        openAddModal(finalStart, finalEnd);
      } else {
        setSelectedDate(dragStart);
      }
    }
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const handleDayDoubleClick = (day: number | null) => {
    if (!day) return;
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(dateStr);
    openAddModal(dateStr, dateStr);
  };

  const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return { 
      daysInMonth: new Date(year, month + 1, 0).getDate(), 
      startingDayOfWeek: new Date(year, month, 1).getDay() 
    };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const days: (number | null)[] = Array.from({ length: startingDayOfWeek }, () => null as number | null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  const getEventsForDate = (dateStr: string) => {
    const targetDate = new Date(dateStr).getTime();
    const daySchedules = events.filter((event) => {
      const start = new Date(event.date).getTime();
      const end = new Date(event.endDate || event.date).getTime();
      return targetDate >= start && targetDate <= end;
    });

    const dayProjects = projects.filter((project) => {
      if (!project.deadline) return false;
      const startStr = project.createdAt || new Date().toISOString().split('T')[0];
      const start = new Date(startStr).getTime();
      const end = new Date(project.deadline).getTime();
      return targetDate >= start && targetDate <= end;
    }).map(project => ({
       id: `proj-${project.id}`,
       title: `[프로젝트] ${project.name}`,
       project: project.name,
       date: project.createdAt || new Date().toISOString().split('T')[0],
       endDate: project.deadline,
       type: 'project',
       color: project.color?.startsWith('#') ? project.color : '#7C6CFF'
    }));

    return [...dayProjects, ...daySchedules];
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  };

  const isDateSelected = (day: number | null) => {
    if (!day) return false;
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    
    if (isDragging && dragStart && dragEnd) {
      const current = new Date(dateStr).getTime();
      const start = new Date(dragStart).getTime();
      const end = new Date(dragEnd).getTime();
      return current >= Math.min(start, end) && current <= Math.max(start, end);
    }
    
    if (selectedDate) return dateStr === selectedDate;
    return false;
  };

  const selectedDateEvents = getEventsForDate(selectedDate);
  const selectedDateObj = new Date(selectedDate);

  return (
    <div className="dashboard pt-4 lg:max-w-5xl lg:mx-auto">
      <section className="card hero-card mb-6">
        <div className="hero-top" style={{ alignItems: 'flex-end', marginBottom: 0 }}>
          <div>
            <div className="hero-meta">팀 일정</div>
            <h1 className="hero-title" style={{ fontSize: '2rem' }}>캘린더</h1>
          </div>
          <button onClick={() => openAddModal()} className="flex items-center gap-2 px-4 py-2 bg-[#7C6CFF] text-white rounded-[14px] text-[14px] font-bold shadow-[0_0_15px_rgba(124,108,255,0.4)] transition-all hover:scale-105 border border-gray-300 dark:border-white/10">
            <Plus className="w-5 h-5" />
            일정 추가
          </button>
        </div>
      </section>

      {/* Calendar Card */}
      <div className="card select-none">
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="hero-title" style={{ fontSize: '1.6rem' }}>
            {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
          </h2>
          <div className="flex items-center gap-1 bg-white/50 dark:bg-white/5 p-1 rounded-xl border border-gray-300 dark:border-white/10">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="p-2 hover:bg-white/60 dark:bg-white/10 rounded-lg transition-all">
              <ChevronLeft className="w-5 h-5 text-[#1A2340] dark:text-white" />
            </button>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="p-2 hover:bg-white/60 dark:bg-white/10 rounded-lg transition-all">
              <ChevronRight className="w-5 h-5 text-[#1A2340] dark:text-white" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-4">
          {["일", "월", "화", "수", "목", "금", "토"].map((day, i) => (
            <div key={day} className={`text-center text-[10px] font-black uppercase tracking-widest py-2 ${i === 0 ? 'text-[#FF6B7A]' : 'text-[#7D879C]/80 dark:text-white/40'}`}>
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            let dayEvents: any[] = [];
            if (day) {
              const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              dayEvents = getEventsForDate(dateStr);
            }
            const today = isToday(day);
            const selected = isDateSelected(day);
            
            return (
              <div
                key={index}
                onMouseDown={() => handleMouseDown(day)}
                onMouseEnter={() => handleMouseEnter(day)}
                onMouseUp={handleMouseUp}
                onDoubleClick={() => handleDayDoubleClick(day)}
                className={`min-h-[100px] flex flex-col rounded-2xl p-2.5 relative transition-all group select-none ${
                  day ? "bg-white dark:bg-[#12182B] border border-gray-200 dark:border-white/5 hover:border-gray-300 dark:border-white/20 hover:bg-white/40 dark:bg-[#1A2340] cursor-pointer" : "bg-transparent"
                } ${today && !selected ? "ring-1 ring-[#7C6CFF] ring-offset-0" : ""} ${selected ? "border-[#7C6CFF] ring-1 ring-[#7C6CFF] bg-[#7C6CFF]/10 shadow-[0_0_15px_rgba(124,108,255,0.2)]" : ""}`}
              >
                {day && (
                  <>
                    <span className={`text-[13px] font-black mb-2 transition-colors z-10 w-7 h-7 rounded-full flex items-center justify-center -ml-1 -mt-1 ${today && !selected ? "text-[#7C6CFF] bg-[#7C6CFF]/10" : (selected ? "text-white bg-[#7C6CFF]" : (index % 7 === 0 ? "text-[#FF6B7A]" : "text-[#7D879C] dark:text-white/60"))}`}>
                      {day}
                    </span>
                    <div className="flex flex-col gap-1.5 w-full overflow-hidden z-10">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className={`w-full h-1.5 rounded-full shadow-sm ${!event.color ? 'bg-white/60 dark:bg-white/10' : ''}`}
                          style={event.color ? { backgroundColor: event.color } : undefined}
                          title={event.title}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Events Section */}
      <div className="space-y-4 pt-6 pb-10">
        <div className="section-head">
          <div className="section-kicker">
            <span className="analysis-dot" style={{ background: '#7C6CFF', boxShadow: '0 0 8px #7C6CFF' }}></span>
            {selectedDateObj.getMonth() + 1}월 {selectedDateObj.getDate()}일의 일정
          </div>
          <button onClick={() => openAddModal(selectedDate, selectedDate)} className="filter-btn !bg-transparent !border-none !text-[#7C6CFF] hover:!text-[#1A2340] dark:!text-white hover:underline transition-all !p-0">+ 일정 등록</button>
        </div>

        {selectedDateEvents.length === 0 ? (
          <div className="card text-center text-sm font-bold text-[#7D879C]/80 dark:text-white/40 border border-gray-200 dark:border-white/5 py-16 shadow-none">
            해당하는 날짜에 일정이 없습니다.<br/>
            <span className="text-[12px] text-gray-300 dark:text-white/20 font-medium mt-2 block">달력 날짜를 더블 클릭하여 일정을 추가해 보세요.</span>
          </div>
        ) : (
          <div className="grid gap-4">
            {selectedDateEvents.map((event) => (
              <div 
                key={event.id} 
                onClick={() => handleEventClick(event)} 
                className="card !p-6 flex items-center gap-6 hover:bg-white/40 dark:bg-[#1A2340] cursor-pointer group"
              >
                <div className={`schedule-item purple !border-none !p-0 bg-transparent`} style={event.color ? {} : undefined}>
                  <div className="schedule-icon" style={{ width: 64, height: 64, borderRadius: 16, ...(event.color ? { backgroundColor: event.color, color: 'white', border: 'none', boxShadow: `0 8px 16px ${event.color}40` } : {}) }}>
                    <CalendarIcon className="w-8 h-8" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="card-title text-[1.2rem] group-hover:text-[#7C6CFF] transition-colors">{event.title}</h3>
                  <p className="hero-meta mt-1">{event.project}</p>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="badge !bg-white/50 dark:!bg-white/5 !text-[#7D879C] dark:!text-white/60 !border-gray-300 dark:!border-white/10 hidden sm:flex">
                      <Clock className="w-4 h-4" />
                      {event.date} {event.endDate && event.endDate !== event.date ? `~ ${event.endDate}` : ''}
                    </div>
                    {event.type === 'deadline' && (
                      <div className="badge !bg-[#FF6B7A]/10 !text-[#FF6B7A] !border-[#FF6B7A]/20">
                        <AlertCircle className="w-4 h-4" />
                        긴급
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-300 dark:text-white/20 group-hover:text-[#7C6CFF] transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="card rounded-[40px] w-full max-w-lg p-10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-gray-300 dark:border-white/10">
            <div className="flex items-center justify-between mb-8">
              <h2 className="hero-title" style={{ fontSize: '1.6rem' }}>
                {editingEventId ? '일정 상세 및 수정' : '새 일정 추가'}
              </h2>
              {editingEventId && (
                <button type="button" onClick={handleDeleteEvent} className="p-3 text-[#FF6B7A] hover:bg-[#FF6B7A]/10 rounded-2xl transition-all">
                  <Trash2 className="w-6 h-6" />
                </button>
              )}
            </div>
            <form onSubmit={handleSaveEvent} className="space-y-6">
              <div className="space-y-2">
                <label className="hero-meta ml-1">일정명</label>
                <input required type="text" placeholder="예: 첫 번째 리뷰 미팅" className="w-full font-black bg-white dark:bg-[#12182B] border border-gray-300 dark:border-white/10 rounded-2xl py-4 px-5 outline-none focus:bg-white/40 dark:bg-[#1A2340] focus:border-[#7C6CFF] focus:shadow-[0_0_15px_rgba(124,108,255,0.2)] transition-all text-[#1A2340] dark:text-white placeholder-white/20" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="hero-meta ml-1">관련 프로젝트</label>
                <select required className="w-full font-black bg-white dark:bg-[#12182B] border border-gray-300 dark:border-white/10 rounded-2xl py-4 px-5 outline-none focus:bg-white/40 dark:bg-[#1A2340] focus:border-[#7C6CFF] focus:shadow-[0_0_15px_rgba(124,108,255,0.2)] transition-all text-[#1A2340] dark:text-white appearance-none" value={formData.project} onChange={e => setFormData({...formData, project: e.target.value})}>
                  <option value="" disabled className="bg-[#f8faff] dark:bg-[#0B1020]">프로젝트 선택</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.name} className="bg-[#f8faff] dark:bg-[#0B1020]">{p.name}</option>
                  ))}
                  <option value="개인 일정" className="bg-[#f8faff] dark:bg-[#0B1020]">개인 일정</option>
                  <option value="팀 전체 일정" className="bg-[#f8faff] dark:bg-[#0B1020]">팀 전체 일정</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="hero-meta ml-1">시작 날짜</label>
                  <input required type="date" className="w-full font-black bg-white dark:bg-[#12182B] border border-gray-300 dark:border-white/10 rounded-2xl py-4 px-5 outline-none focus:bg-white/40 dark:bg-[#1A2340] focus:border-[#7C6CFF] transition-all text-[#1A2340] dark:text-white" value={formData.date} onChange={e => {
                    const newDate = e.target.value;
                    setFormData(prev => ({...prev, date: newDate, endDate: prev.endDate < newDate ? newDate : prev.endDate}))
                  }} style={{ colorScheme: 'dark' }} />
                </div>
                <div className="space-y-2">
                  <label className="hero-meta ml-1">종료 날짜</label>
                  <input required type="date" className="w-full font-black bg-white dark:bg-[#12182B] border border-gray-300 dark:border-white/10 rounded-2xl py-4 px-5 outline-none focus:bg-white/40 dark:bg-[#1A2340] focus:border-[#7C6CFF] transition-all text-[#1A2340] dark:text-white" value={formData.endDate} min={formData.date} onChange={e => setFormData({...formData, endDate: e.target.value})} style={{ colorScheme: 'dark' }} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="hero-meta ml-1">유형</label>
                <select className="w-full font-black bg-white dark:bg-[#12182B] border border-gray-300 dark:border-white/10 rounded-2xl py-4 px-5 outline-none focus:bg-white/40 dark:bg-[#1A2340] focus:border-[#7C6CFF] transition-all text-[#1A2340] dark:text-white appearance-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="deadline" className="bg-[#f8faff] dark:bg-[#0B1020]">마감일 (긴급)</option>
                  <option value="meeting" className="bg-[#f8faff] dark:bg-[#0B1020]">미팅</option>
                  <option value="presentation" className="bg-[#f8faff] dark:bg-[#0B1020]">발표</option>
                  <option value="milestone" className="bg-[#f8faff] dark:bg-[#0B1020]">마일스톤</option>
                  <option value="other" className="bg-[#f8faff] dark:bg-[#0B1020]">기타</option>
                </select>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={closeModal} className="flex-1 py-4 font-black bg-white/50 dark:bg-white/5 hover:bg-white/60 dark:bg-white/10 text-[#7D879C] dark:text-white/60 hover:text-[#1A2340] dark:text-white rounded-2xl transition-all uppercase tracking-widest border border-gray-300 dark:border-white/10">닫기</button>
                <button type="submit" className="flex-1 py-4 font-black bg-[#7C6CFF] hover:bg-[#7C6CFF]/90 text-white rounded-2xl shadow-[0_0_20px_rgba(124,108,255,0.3)] transition-all active:scale-95 uppercase tracking-widest border border-[#7C6CFF]/50">
                  {editingEventId ? '수정 내용 저장' : '추가하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}