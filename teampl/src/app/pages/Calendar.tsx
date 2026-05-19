import { Plus, Clock, AlertCircle, Trash2, Calendar as CalendarIcon } from "lucide-react";
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

  const [events, setEvents] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({ 
    title: '', 
    project: '', 
    date: todayStr, 
    endDate: todayStr, 
    type: 'other' 
  });

  useEffect(() => {
    projectApi.getProjects()
      .then(data => setProjects(data))
      .catch(console.error);

    if (numProjectId) {
      scheduleApi.getSchedules(numProjectId)
        .then(data => setEvents(data))
        .catch(console.error);
    } else {
      scheduleApi.getGlobalSchedules()
        .then(data => setEvents(data))
        .catch(console.error);
    }
  }, [numProjectId]);

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetProjectId = numProjectId || (formData.project === 'personal' ? null : Number(formData.project));
      const payload = { ...formData, projectId: targetProjectId };
      
      if (editingEventId) {
        let updatedEvent;
        if (numProjectId) {
          updatedEvent = await scheduleApi.updateSchedule(numProjectId, editingEventId, formData);
        } else {
          updatedEvent = await scheduleApi.updateGlobalSchedule(editingEventId, payload);
        }
        setEvents(events.map(ev => ev.id === editingEventId ? updatedEvent : ev));
      } else {
        let newEvent;
        if (numProjectId) {
          newEvent = await scheduleApi.createSchedule(numProjectId, formData);
        } else {
          newEvent = await scheduleApi.createGlobalSchedule(payload);
        }
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
      if (numProjectId) {
        await scheduleApi.deleteSchedule(numProjectId, editingEventId);
      } else {
        const targetProjectId = formData.project === 'personal' ? null : Number(formData.project);
        await scheduleApi.deleteGlobalSchedule(editingEventId, targetProjectId);
      }
      setEvents(events.filter(ev => ev.id !== editingEventId));
      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDirectDelete = async (e: React.MouseEvent, eventItem: any) => {
    e.stopPropagation();
    if (!confirm('이 일정을 삭제하시겠습니까?')) return;
    try {
      if (numProjectId) {
        await scheduleApi.deleteSchedule(numProjectId, eventItem.id);
      } else {
        const targetProjectId = eventItem.projectId || null;
        await scheduleApi.deleteGlobalSchedule(eventItem.id, targetProjectId);
      }
      setEvents(events.filter(ev => ev.id !== eventItem.id));
    } catch (err) {
      console.error(err);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEventId(null);
    setFormData({ title: '', project: numProjectId ? String(numProjectId) : 'personal', date: todayStr, endDate: todayStr, type: 'other' });
  };

  const openAddModal = () => {
    setFormData({ 
      title: '', 
      project: numProjectId ? String(numProjectId) : (projects.length > 0 ? String(projects[0].id) : 'personal'), 
      type: 'other', 
      date: todayStr, 
      endDate: todayStr 
    });
    setEditingEventId(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (event: any) => {
    if (String(event.id).startsWith('proj-')) return;
    
    setEditingEventId(event.id);
    setFormData({
      title: event.title,
      project: event.projectId ? String(event.projectId) : 'personal',
      date: event.date.split('T')[0],
      endDate: (event.endDate || event.date).split('T')[0],
      type: event.type
    });
    setIsModalOpen(true);
  };

  const parseDateBadge = (dateStr: string) => {
    if (!dateStr) return { month: '01월', day: '01', cleanDate: '' };
    const cleanDate = dateStr.split('T')[0].replace(/\./g, '-');
    const parts = cleanDate.split('-');
    const month = parts[1] ? `${parts[1]}월` : '01월';
    const day = parts[2] ? parts[2] : '01';
    return { month, day, cleanDate };
  };

  const getTypeDescription = (type: string) => {
    switch (type) {
      case 'deadline':
        return '중요 마감 일정입니다. 기한 내 완수를 적극 권장합니다.';
      case 'meeting':
        return '팀원 간 상호 협업 및 조율을 위한 정기/임시 회의 일정입니다.';
      case 'presentation':
        return '개발 산출물 발표 및 피드백 공유를 위한 일정입니다.';
      case 'milestone':
        return '프로젝트 완수를 향한 이정표이자 마일스톤 단계입니다.';
      default:
        return '팀 공동 과업 수행 및 개인을 위한 맞춤형 일정입니다.';
    }
  };

  const sortedEvents = [...events].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div className="dashboard pt-4 w-full max-w-5xl mx-auto px-4 sm:px-6">
      {/* Top Title & Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="hero-meta">{numProjectId ? "팀 일정" : "전체 일정"}</div>
          <h1 className="hero-title" style={{ fontSize: '2.2rem' }}>
            {numProjectId ? "일정 관리" : "스케줄러"}
          </h1>
        </div>
        <button 
          onClick={openAddModal} 
          className="flex items-center gap-2 px-5 py-3 bg-[#11B886] hover:bg-[#0EA271] text-white rounded-[16px] text-[14px] font-bold shadow-[0_4px_20px_rgba(17,184,134,0.3)] transition-all hover:scale-[1.03] active:scale-95 border border-[#11B886]/20"
        >
          <Plus className="w-5 h-5" />
          일정 추가
        </button>
      </div>

      {/* Schedule Cards Container */}
      <div className="space-y-4">
        {sortedEvents.length === 0 ? (
          <div className="card text-center py-20 border border-gray-100 dark:border-white/5 bg-white dark:bg-[#0F172A] rounded-[32px] shadow-sm">
            <CalendarIcon className="w-12 h-12 text-[#7D879C]/40 mx-auto mb-4" />
            <p className="text-sm font-black text-[#7D879C] dark:text-white/60">등록된 일정이 없습니다.</p>
            <span className="text-[12px] text-gray-400 dark:text-white/30 font-medium mt-2 block">우측 상단의 "+ 일정 추가" 버튼을 눌러 첫 일정을 등록해보세요.</span>
          </div>
        ) : (
          <div className="grid gap-4">
            {sortedEvents.map((event) => {
              const { month, day, cleanDate } = parseDateBadge(event.date);
              const isProjectDeadline = String(event.id).startsWith('proj-');
              
              return (
                <div 
                  key={event.id} 
                  onClick={() => handleEventClick(event)} 
                  className={`card !p-5 flex items-center gap-5 hover:bg-gray-50/50 dark:hover:bg-white/5 cursor-pointer border border-gray-100 dark:border-white/5 bg-white dark:bg-[#0F172A] rounded-[24px] transition-all group shadow-sm hover:translate-y-[-2px] ${
                    isProjectDeadline ? 'opacity-85 pointer-events-none' : ''
                  }`}
                >
                  {/* Left Date Square Badge */}
                  <div className="w-[60px] h-[60px] rounded-2xl bg-[#11B886] text-white flex flex-col items-center justify-center shrink-0 shadow-md shadow-[#11B886]/10">
                    <span className="text-[10px] font-bold tracking-tight opacity-90">{month}</span>
                    <span className="text-[20px] font-black leading-tight -mt-0.5">{day}</span>
                  </div>

                  {/* Center Main Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-black text-[#1A2340] dark:text-white truncate group-hover:text-[#11B886] transition-colors">
                        {event.title}
                      </h3>
                      {event.type === 'deadline' && (
                        <span className="px-2 py-0.5 text-[9px] font-black bg-red-500/10 text-red-500 rounded-md border border-red-500/20">
                          긴급
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-gray-400 dark:text-white/40 truncate leading-relaxed">
                      {getTypeDescription(event.type)}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-white/30">
                        <Clock className="w-3.5 h-3.5" />
                        {cleanDate} {event.endDate && event.endDate.split('T')[0] !== cleanDate ? `~ ${event.endDate.split('T')[0]}` : ''}
                      </div>
                      <span className="text-[10px] font-black text-[#11B886] bg-[#11B886]/10 px-2 py-0.5 rounded-full">
                        {numProjectId ? "팀 프로젝트" : (event.project?.name || event.project || "개인 일정")}
                      </span>
                    </div>
                  </div>

                  {/* Right Actions */}
                  {!isProjectDeadline && (
                    <button 
                      onClick={(e) => handleDirectDelete(e, event)}
                      className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="card rounded-[32px] w-full max-w-lg p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-gray-100 dark:border-white/10 bg-white dark:bg-[#0F172A]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="hero-title" style={{ fontSize: '1.6rem' }}>
                {editingEventId ? '일정 상세 및 수정' : '새 일정 추가'}
              </h2>
              {editingEventId && (
                <button type="button" onClick={handleDeleteEvent} className="p-3 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all">
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
            
            <form onSubmit={handleSaveEvent} className="space-y-5">
              <div className="space-y-1.5">
                <label className="hero-meta ml-1">일정명</label>
                <input required type="text" placeholder="예: 첫 번째 리뷰 미팅" className="w-full font-black bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 rounded-2xl py-3.5 px-4 outline-none focus:bg-white dark:focus:bg-[#1E293B] focus:border-[#11B886] focus:shadow-[0_0_15px_rgba(17,184,134,0.15)] transition-all text-[#1A2340] dark:text-white placeholder-gray-400 dark:placeholder-white/20" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>

              {!numProjectId && (
                <div className="space-y-1.5">
                  <label className="hero-meta ml-1">관련 프로젝트</label>
                  <select required className="w-full font-black bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 rounded-2xl py-3.5 px-4 outline-none focus:bg-white dark:focus:bg-[#1E293B] focus:border-[#11B886] focus:shadow-[0_0_15px_rgba(17,184,134,0.15)] transition-all text-[#1A2340] dark:text-white appearance-none" value={formData.project} onChange={e => setFormData({...formData, project: e.target.value})}>
                    <option value="" disabled className="bg-white dark:bg-[#0F172A]">분류 선택</option>
                    {projects.map(p => (
                      <option key={p.id} value={String(p.id)} className="bg-white dark:bg-[#0F172A]">{p.name}</option>
                    ))}
                    <option value="personal" className="bg-white dark:bg-[#0F172A]">개인 일정</option>
                  </select>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="hero-meta ml-1">시작 날짜</label>
                  <input required type="date" className="w-full font-black bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 rounded-2xl py-3.5 px-4 outline-none focus:bg-white dark:focus:bg-[#1E293B] focus:border-[#11B886] transition-all text-[#1A2340] dark:text-white" value={formData.date} onChange={e => {
                    const newDate = e.target.value;
                    setFormData(prev => ({...prev, date: newDate, endDate: prev.endDate < newDate ? newDate : prev.endDate}))
                  }} style={{ colorScheme: 'dark' }} />
                </div>
                <div className="space-y-1.5">
                  <label className="hero-meta ml-1">종료 날짜</label>
                  <input required type="date" className="w-full font-black bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 rounded-2xl py-3.5 px-4 outline-none focus:bg-white dark:focus:bg-[#1E293B] focus:border-[#11B886] transition-all text-[#1A2340] dark:text-white" value={formData.endDate} min={formData.date} onChange={e => setFormData({...formData, endDate: e.target.value})} style={{ colorScheme: 'dark' }} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="hero-meta ml-1">유형</label>
                <select className="w-full font-black bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 rounded-2xl py-3.5 px-4 outline-none focus:bg-white dark:focus:bg-[#1E293B] focus:border-[#11B886] transition-all text-[#1A2340] dark:text-white appearance-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="deadline" className="bg-white dark:bg-[#0F172A]">마감일 (긴급)</option>
                  <option value="meeting" className="bg-white dark:bg-[#0F172A]">미팅</option>
                  <option value="presentation" className="bg-white dark:bg-[#0F172A]">발표</option>
                  <option value="milestone" className="bg-white dark:bg-[#0F172A]">마일스톤</option>
                  <option value="other" className="bg-white dark:bg-[#0F172A]">기타</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-3.5 font-black bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 rounded-2xl transition-all uppercase tracking-widest border border-gray-200 dark:border-white/10">닫기</button>
                <button type="submit" className="flex-1 py-3.5 font-black bg-[#11B886] hover:bg-[#0EA271] text-white rounded-2xl shadow-[0_4px_15px_rgba(17,184,134,0.3)] transition-all active:scale-95 uppercase tracking-widest border border-[#11B886]/50">
                  {editingEventId ? '수정 완료' : '추가하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}