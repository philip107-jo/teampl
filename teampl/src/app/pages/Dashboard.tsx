import React, { useState, useEffect } from "react";
import { Bell, BarChart3, CheckCircle2, AlertCircle, Users2, X, Clock, Database, Zap, Target, Crown, Calendar as CalendarIcon, MessageSquare, FolderOpen } from "lucide-react";
import { useNavigate } from "react-router";
import { Task } from "../types";
import { taskApi } from "../api/taskApi";
import { projectApi } from "../api/projectApi";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // -- Local State --
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);


  useEffect(() => {
    const fetchData = () => {
      Promise.all([
        projectApi.getProjects().catch(() => [])
      ])
        .then(([fetchedProjects]) => {
          if (fetchedProjects && fetchedProjects.length > 0) {
            setProjects(fetchedProjects);
            // 선택된 프로젝트 정보도 최신 데이터로 갱신 (팀장 위임 등 반영)
            setSelectedProject((prev: any) => {
              if (!prev) return fetchedProjects[0];
              const updated = fetchedProjects.find((p: any) => p.id === prev.id);
              return updated ?? prev;
            });
          } else {
            setProjects([]);
            setSelectedProject(null);
          }
        })
        .finally(() => setIsLoading(false));
    };

    fetchData();
    const intervalId = setInterval(fetchData, 10000);
    return () => clearInterval(intervalId);
  }, []);

  // 선택된 프로젝트의 Task를 가져오기
  useEffect(() => {
    if (!selectedProject) { 
      setTasks([]); 
      return; 
    }
    taskApi.getTasks(selectedProject.id)
      .then(setTasks)
      .catch(() => setTasks([]));
  }, [selectedProject]);

  // Dynamic calculations based on real mock data
  const totalTasks = tasks.length;
  const completedCount = tasks.filter(t => t.status === "DONE").length;
  const inProgressCount = tasks.filter(t => t.status === "IN_PROGRESS").length;
  const todoCount = tasks.filter(t => t.status === "TODO").length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const handleSelectProject = (project: any) => {
    setSelectedProject(project);
    setIsProjectModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="dashboard pb-safe flex items-center justify-center p-6 h-[70vh]">
        <div className="animate-spin w-8 h-8 rounded-full border-4 border-[#11B886] border-t-transparent"></div>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="dashboard pb-safe flex flex-col items-center justify-center p-6 text-center h-[70vh]">
        <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-[24px] flex items-center justify-center mb-6 opacity-80 shadow-inner">
          <Database className="w-10 h-10 text-gray-400 dark:text-gray-500" />
        </div>
        <h2 className="text-[20px] font-black text-[#1A2340] dark:text-white mb-2 tracking-tight">참여 중인 프로젝트가 없습니다</h2>
        <p className="text-[13px] font-bold text-[#7D879C]/80 dark:text-white/40 mb-8 max-w-[280px] leading-relaxed">대시보드를 보려면 먼저 프로젝트를 생성하거나 초대를 통해 팀에 합류하세요.</p>
        <button 
          onClick={() => navigate("/projects")}
          className="px-6 py-4 bg-[#11B886] text-white rounded-2xl text-[14px] font-black tracking-widest uppercase shadow-[0_0_20px_rgba(17,184,134,0.3)] hover:opacity-90 active:scale-95 transition-all"
        >
          프로젝트 화면으로 가기
        </button>
      </div>
    );
  }

  const rawMembers = selectedProject?.membersList 
    ? selectedProject.membersList 
    : [{ 
        id: user?.id || 1, 
        name: user?.name || "나 (팀장)", 
        email: user?.email, 
        department: user?.department 
      }];

  const displayMembers = [...rawMembers].sort((a: any, b: any) => {
    if (a.role === 'LEADER') return -1;
    if (b.role === 'LEADER') return 1;
    return 0;
  });

  return (
    <div className="dashboard pb-safe">
      <section className="card hero-card">
        <div className="hero-top">
          <div className="flex items-start gap-4">
            <div>
              <div className="hero-meta">{selectedProject.course}</div>
              <h1 className="hero-title">{selectedProject.name}</h1>
            </div>
          </div>
          <button 
            onClick={() => navigate("/notifications")}
            className="hero-action active:scale-90"
            title="알림 확인"
          >
            <Bell className="w-6 h-6" />
          </button>
        </div>

        <div className="hero-bottom">
          <div className="hero-progress-head">
            <span className="hero-progress-label">전체 진행률</span>
            <span className="hero-progress-value">{progressPercentage}%</span>
          </div>
          <div className="progress-track">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </section>

      <section className="card schedule-card">
        <div className="card-head">
          <div className="head-left">
            <div className="icon-chip">📅</div>
            <h2 className="card-title">다가오는 일정</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge">일정 {todoCount}개</span>
          </div>
        </div>

        <div className="schedule-list">
          {tasks.filter(t => t.status === "TODO").slice(0, 3).map((task, idx) => (
            <div key={task.id} className={`schedule-item ${idx === 0 ? 'purple' : idx === 1 ? 'orange' : 'blue'}`}>
              <div className="schedule-main">
                <div className="schedule-icon">
                  {idx === 0 ? <Users2 className="w-5 h-5" /> : idx === 1 ? <AlertCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
                <div>
                  <p className="schedule-title truncate max-w-[180px]">{task.title}</p>
                  <p className="schedule-date">{task.deadline?.replace(/-/g, '.')}</p>
                </div>
              </div>
              <span className="schedule-status">{idx === 0 ? '대기중' : idx === 1 ? 'D-day' : '예정'}</span>
            </div>
          ))}
          {todoCount === 0 && <p className="text-center py-4 opacity-50 text-sm">대기 중인 일정이 없습니다.</p>}
        </div>
      </section>

      <div className="section-head">
        <div className="section-title-wrap">
          <div className="section-kicker">↗ 프로젝트 팀원</div>
          <div className="section-sub">프로젝트를 함께하는 팀원 목록입니다</div>
        </div>

        <button 
          onClick={() => setIsProjectModalOpen(true)}
          className="filter-btn active:scale-95"
        >
          <span className="truncate max-w-[150px]">{selectedProject.name}</span>
          <span>⌄</span>
        </button>
      </div>

      <section className="flex justify-center gap-6 sm:gap-10 my-8">
        {[
          { id: 'tasks', label: '업무', icon: <CheckCircle2 className="w-8 h-8" />, color: 'bg-[#FFB547]', link: `/projects/${selectedProject.id}?tab=tasks` },
          { id: 'calendar', label: '일정', icon: <CalendarIcon className="w-8 h-8" />, color: 'bg-[#11B886]', link: `/projects/${selectedProject.id}?tab=calendar` },
          { id: 'chat', label: '채팅', icon: <MessageSquare className="w-8 h-8" />, color: 'bg-[#27D7A1]', link: `/projects/${selectedProject.id}?tab=chat` },
          { id: 'drive', label: '자료', icon: <FolderOpen className="w-8 h-8" />, color: 'bg-[#FF6B7A]', link: `/projects/${selectedProject.id}?tab=drive` }
        ].map(shortcut => (
          <button 
            key={shortcut.id}
            onClick={() => navigate(shortcut.link)}
            className="flex flex-col items-center gap-3 group active:scale-95 transition-all"
          >
            <div className={`w-20 h-20 rounded-full ${shortcut.color} flex items-center justify-center text-white shadow-lg group-hover:shadow-2xl transition-all group-hover:-translate-y-2`}>
              {shortcut.icon}
            </div>
            <span className="text-sm font-black text-[#1A2340] dark:text-white/80">{shortcut.label}</span>
          </button>
        ))}
      </section>

      <section className="analysis-grid">
        <article className="card analysis-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="analysis-title !mb-0">
              <span className="analysis-dot"></span> 프로젝트 팀원
            </h3>
          </div>

          <div className="contribution-list space-y-4">
            {displayMembers.map((member: any, idx: number) => {
              return (
                <div key={member.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#11B886]/10 text-[#11B886] flex items-center justify-center font-bold text-sm">
                      {member.name?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-black text-[#1A2340] dark:text-white">{member.name}</span>
                        {member.role === 'LEADER' && (
                          <Crown className="w-3.5 h-3.5 text-[#FFB547] fill-[#FFB547] drop-shadow-[0_0_4px_rgba(255,181,71,0.8)]" />
                        )}
                      </div>
                      <p className="text-[10px] font-semibold text-gray-400 dark:text-white/30">{member.email}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-white/5 rounded-lg text-[11px] font-bold text-gray-500 dark:text-white/40">
                    {member.role === 'LEADER' ? '팀장' : '팀원'}
                  </span>
                </div>
              );
            })}
          </div>
        </article>

        <article className="card analysis-card donut-card">
          <h3 className="analysis-title">
            <span className="analysis-dot"></span> 프로젝트 구성 비중
          </h3>

          <div className="donut-wrap">
            <div 
              className="donut"
              style={{
                background: `conic-gradient(
                  var(--theme-teal) 0% ${Math.round((completedCount/totalTasks)*100)}%, 
                  var(--theme-blue) ${Math.round((completedCount/totalTasks)*100)}% ${Math.round(((completedCount+inProgressCount)/totalTasks)*100)}%, 
                  #808ca8 ${Math.round(((completedCount+inProgressCount)/totalTasks)*100)}% ${Math.round(((completedCount+inProgressCount+todoCount)/totalTasks)*100)}%, 
                  var(--theme-red) ${Math.round(((completedCount+inProgressCount+todoCount)/totalTasks)*100)}% 100%
                )`
              } as any}
            >
              <div className="donut-center">
                <div>
                  <div className="donut-value">100%</div>
                  <div className="donut-label">전체 {totalTasks}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="legend">
            <div className="legend-item">
              <div className="legend-left"><span className="legend-dot done"></span>완료</div>
              <div className="legend-value">{completedCount}</div>
            </div>
            <div className="legend-item">
              <div className="legend-left"><span className="legend-dot progress"></span>진행중</div>
              <div className="legend-value">{inProgressCount}</div>
            </div>
            <div className="legend-item">
              <div className="legend-left"><span className="legend-dot waiting"></span>대기</div>
              <div className="legend-value">{todoCount}</div>
            </div>
            <div className="legend-item">
              <div className="legend-left"><span className="legend-dot delay"></span>지연</div>
              <div className="legend-value">0</div>
            </div>
          </div>
        </article>
      </section>

      {/* -- Project Selection Modal -- */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="card w-full max-sm:max-w-[calc(100%-2rem)] max-w-sm shadow-[0_20px_60px_rgba(0,0,0,0.5)] !p-6 border border-gray-300 dark:border-white/10 dark:bg-[#132038]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="hero-title !text-xl">프로젝트 선택</h2>
              <button onClick={() => setIsProjectModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                <X className="w-5 h-5 text-[#7D879C] dark:text-white/60" />
              </button>
            </div>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelectProject(project)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-95 text-left border ${
                    selectedProject.id === project.id 
                      ? "bg-[#11B886]/10 border-[#11B886] shadow-[0_0_15px_rgba(17,184,134,0.2)]" 
                      : "bg-white/5 border-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-[#11B886]/20 text-[#11B886]`}>
                    {typeof project.icon === 'string' || !project.icon ? <Database className="w-6 h-6"/> : <project.icon className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="text-[14px] font-black text-[#1A2340] dark:text-white leading-tight mb-1">{project.name}</p>
                    <p className="text-[11px] font-bold text-[#7D879C] dark:text-white/40 uppercase">{project.course}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="sparkle"></div>
    </div>
  );
}
