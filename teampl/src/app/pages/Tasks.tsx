import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  Plus, Search, LayoutGrid, List as ListIcon, 
  Filter, MoreHorizontal, Calendar, CheckCircle2, 
  Clock, Trash2, X, ChevronDown, UserPlus, Users
} from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Task, TaskStatus } from "../types";
import KanbanBoard from "../components/KanbanBoard";
import { taskApi } from "../api/taskApi";
import { projectApi } from "../api/projectApi";
import { useAuth } from "../context/AuthContext";

interface TasksProps {
  projectId?: number;
}

export default function Tasks({ projectId: propProjectId }: TasksProps = {}) {
  const params = useParams<{ projectId: string }>();
  const numProjectId = propProjectId || Number(params.projectId);
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  useEffect(() => {
    if (!numProjectId) return;
    
    // 유저 정보가 있으면 기본 담당자(이메일)로 지정
    if (user) setSelectedAssignees([user.email]);

    taskApi.getTasks(numProjectId)
      .then(data => setTasks(data))
      .catch(err => console.error("태스크 로드 에러:", err));

    // 프로젝트 팀원 정보 로드
    projectApi.getProjects().then(projects => {
      const p = projects.find(proj => String(proj.id) === String(numProjectId));
      if (p && p.membersList) setProjectMembers(p.membersList);
    });
  }, [numProjectId, user]);

  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [newTaskDeadline, setNewTaskDeadline] = useState(new Date().toISOString().split('T')[0]);

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>("TODO");

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      const newTask = await taskApi.createTask(numProjectId, {
        title: newTaskTitle,
        status: newTaskStatus,
        priority: newTaskPriority,
        deadline: newTaskDeadline,
        assignees: selectedAssignees // 담당자 포함
      });
      setTasks([newTask, ...tasks]);
      setNewTaskTitle("");
      setNewTaskPriority("medium");
      setNewTaskStatus("TODO");
      setNewTaskDeadline(new Date().toISOString().split('T')[0]);
      if (user) setSelectedAssignees([user.email]);
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("태스크 추가 실패!");
    }
  };

  const toggleTaskStatus = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    let target: TaskStatus;
    if (task.status === 'TODO') target = 'IN_PROGRESS';
    else if (task.status === 'IN_PROGRESS') target = 'DONE';
    else target = 'TODO';

    try {
      await taskApi.updateTaskStatus(numProjectId, id, target);
      setTasks(tasks.map(t => t.id === id ? { ...t, status: target } : t));
    } catch (err) {
      console.error(err);
      alert("상태 수정 실패!");
    }
  };

  const handleDeleteTask = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    if (!window.confirm("정말 이 태스크를 삭제하시겠습니까?")) return;
    try {
      await taskApi.deleteTask(numProjectId, taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      console.error(err);
      alert("태스크 삭제에 실패했습니다.");
    }
  };

  const moveTask = async (taskId: string, targetStatus: TaskStatus) => {
    try {
      await taskApi.updateTaskStatus(numProjectId, taskId, targetStatus);
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));
    } catch (e) {
      console.error(e);
      alert("카드 이동 실패!");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-[#FF4D4D] bg-[#FF4D4D]/10 border-[#FF4D4D]/20 shadow-[0_0_15px_rgba(255,77,77,0.1)]";
      case "medium": return "text-[#FFA500] bg-[#FFA500]/10 border-[#FFA500]/20 shadow-[0_0_15px_rgba(255,165,0,0.1)]";
      case "low": return "text-[#4D94FF] bg-[#4D94FF]/10 border-[#4D94FF]/20 shadow-[0_0_15px_rgba(77,148,255,0.1)]";
      default: return "text-[#7D879C]/80 dark:text-white/40 bg-white/50 dark:bg-white/5 border-gray-300 dark:border-white/10";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high": return "긴급";
      case "medium": return "보통";
      case "low": return "여유";
      default: return priority.toUpperCase();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DONE": return (
        <div className="w-10 h-10 rounded-2xl bg-[#23D7A1]/20 flex items-center justify-center border border-[#23D7A1]/30 shadow-[0_0_20px_rgba(35,215,161,0.3)]">
          <CheckCircle2 className="w-6 h-6 text-[#23D7A1]" />
        </div>
      );
      case "IN_PROGRESS": return (
        <div className="w-10 h-10 rounded-2xl bg-[#7C6CFF]/20 flex items-center justify-center border border-[#7C6CFF]/30 shadow-[0_0_20px_rgba(124,108,255,0.3)]">
          <Clock className="w-6 h-6 text-[#7C6CFF]" />
        </div>
      );
      default: return (
        <div className="w-10 h-10 rounded-2xl bg-white/40 dark:bg-[#12182B] flex items-center justify-center border border-gray-300 dark:border-white/10 transition-all hover:border-[#7C6CFF]/40">
          <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-white/20" />
        </div>
      );
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="dashboard pt-4 lg:max-w-7xl lg:mx-auto flex flex-col h-[calc(100vh-2rem)]">
        {/* Header */}
        <section className="card hero-card mb-6 flex-shrink-0">
          <div className="hero-top" style={{ alignItems: 'flex-end', marginBottom: 0 }}>
            <div>
              <p className="hero-meta uppercase">워크스페이스</p>
              <h1 className="hero-title" style={{ fontSize: '2rem' }}>
                태스크 보드
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-white dark:bg-[#12182B] p-1.5 rounded-2xl border border-gray-300 dark:border-white/10">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === "list" ? "bg-white/60 dark:bg-white/10 text-[#7C6CFF]" : "text-[#7D879C]/80 dark:text-white/40 hover:text-[#1A2340] dark:text-white"}`}
                  title="리스트 뷰"
                >
                  <ListIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("board")}
                  className={`p-2.5 rounded-xl transition-all ${viewMode === "board" ? "bg-white/60 dark:bg-white/10 text-[#7C6CFF]" : "text-[#7D879C]/80 dark:text-white/40 hover:text-[#1A2340] dark:text-white"}`}
                  title="칸반 보드"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-[#7C6CFF] text-white rounded-2xl text-[14px] font-black shadow-[0_0_20px_rgba(124,108,255,0.4)] hover:opacity-90 active:scale-95 transition-all border border-[#7C6CFF]/50"
              >
                <Plus className="w-5 h-5" />
                태스크 추가
              </button>
            </div>
          </div>
        </section>

        {viewMode === "list" ? (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Filters */}
            <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide flex-shrink-0">
              {["all", "TODO", "IN_PROGRESS", "DONE"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-5 py-2.5 rounded-[12px] text-[12px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filter === f
                    ? "bg-[#7C6CFF] text-white shadow-[0_0_15px_rgba(124,108,255,0.4)] border border-[#7C6CFF]/50"
                    : "bg-white dark:bg-[#12182B] text-[#7D879C]/80 dark:text-white/40 border border-gray-200 dark:border-white/5 hover:bg-white/60 dark:bg-white/10 hover:text-[#1A2340] dark:text-white"
                  }`}
                >
                  {f === "all" ? "전체" : f === "TODO" ? "대기" : f === "IN_PROGRESS" ? "진행중" : "완료"} (
                  {f === "all" ? tasks.length : tasks.filter(t => t.status === f).length})
                </button>
              ))}
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto space-y-3 pb-24 scrollbar-hide">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTaskStatus(task.id)}
                  className={`card !p-5 hover:bg-white/40 dark:bg-[#1A2340] cursor-pointer group flex items-center gap-6 ${task.status === 'DONE' ? 'opacity-40 grayscale' : ''}`}
                >
                  <div className="flex-shrink-0 group-hover:scale-110 transition-transform">{getStatusIcon(task.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-black text-[17px] tracking-tight truncate mb-2.5 transition-colors ${task.status === 'DONE' ? 'line-through text-[#7D879C]/80 dark:text-white/40' : 'text-[#1A2340] dark:text-white group-hover:text-[#7C6CFF]'}`}>
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-4">
                          <span className={`text-[11px] font-black px-3 py-1.5 rounded-[10px] uppercase tracking-widest border transition-all ${getPriorityColor(task.priority)}`}>
                            {getPriorityLabel(task.priority)}
                          </span>
                          <span className="text-[11px] text-[#7D879C] dark:text-white/40 font-bold uppercase tracking-widest flex items-center gap-2 bg-white/40 dark:bg-[#12182B] px-3 py-1 rounded-[10px] border border-gray-200 dark:border-white/5">
                            <Clock className="w-4 h-4" />
                            {task.deadline}
                          </span>
                          {/* 담당자 표시 추가 */}
                          <div className="flex -space-x-2 ml-2">
                            {task.assignees?.map((email: string) => {
                              const m = projectMembers.find(mem => mem.email === email);
                              return (
                                <div 
                                  key={email}
                                  title={m?.name || "알 수 없는 유저"}
                                  className={`w-6 h-6 rounded-full border-2 border-[var(--theme-bg)] flex items-center justify-center text-[9px] font-black text-white bg-[#7C6CFF]`}
                                >
                                  {m?.name?.[0] || '?'}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 border-l border-gray-200 dark:border-white/10 pl-4 ml-2">
                        <button 
                          onClick={(e) => handleDeleteTask(e, task.id)}
                          className="p-2 text-[#7D879C]/50 hover:text-[#FF6B7A] hover:bg-[#FF6B7A]/10 rounded-xl transition-all"
                          title="태스크 삭제"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden min-h-0 bg-[#f8faff] dark:bg-[#0B1020]/30 rounded-[40px] p-6 border border-gray-200 dark:border-white/5">
            <KanbanBoard 
              tasks={tasks} 
              projectMembers={projectMembers}
              onMoveTask={moveTask} 
              onToggleTask={toggleTaskStatus} 
              onDeleteTask={handleDeleteTask} 
            />
          </div>
        )}

        {/* Add Task Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="card w-full max-w-lg shadow-[0_20px_60px_rgba(0,0,0,0.5)] !p-10 border border-gray-300 dark:border-white/10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="hero-title" style={{ fontSize: '1.6rem' }}>새 태스크 추가</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/60 dark:bg-white/10 rounded-2xl transition-all">
                  <X className="w-6 h-6 text-[#7D879C]/80 dark:text-white/40" />
                </button>
              </div>
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="hero-meta ml-1">태스크 이름</label>
                    <input
                      type="text"
                      placeholder="무엇을 완료해야 하나요?"
                      autoFocus
                      className="w-full px-6 py-4 bg-white dark:bg-[#12182B] border border-gray-300 dark:border-white/10 rounded-2xl focus:border-[#7C6CFF] focus:shadow-[0_0_15px_rgba(124,108,255,0.2)] focus:bg-white/40 dark:bg-[#1A2340] outline-none transition-all placeholder-white/20 font-black text-[#1A2340] dark:text-white text-[15px]"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="hero-meta ml-1">초기 상태</label>
                      <div className="flex bg-white dark:bg-[#12182B] p-1.5 rounded-2xl border border-gray-300 dark:border-white/10">
                        <button
                          onClick={() => setNewTaskStatus("TODO")}
                          className={`flex-1 py-2.5 rounded-xl text-[11px] font-black transition-all ${newTaskStatus === "TODO" 
                            ? "bg-white/60 dark:bg-white/10 text-[#7C6CFF]"
                            : "text-[#7D879C]/80 dark:text-white/40 hover:text-[#1A2340] dark:text-white"
                          }`}
                        >
                          대기 중
                        </button>
                        <button
                          onClick={() => setNewTaskStatus("IN_PROGRESS")}
                          className={`flex-1 py-2.5 rounded-xl text-[11px] font-black transition-all ${newTaskStatus === "IN_PROGRESS" 
                            ? "bg-[#7C6CFF]/20 text-[#7C6CFF] border border-[#7C6CFF]/30"
                            : "text-[#7D879C]/80 dark:text-white/40 hover:text-[#1A2340] dark:text-white"
                          }`}
                        >
                          진행 중
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="hero-meta ml-1">마감일</label>
                      <input
                        type="date"
                        className="w-full px-5 py-2.5 bg-white dark:bg-[#12182B] border border-gray-300 dark:border-white/10 rounded-2xl focus:border-[#7C6CFF] outline-none transition-all font-black text-[#1A2340] dark:text-white text-[13px]"
                        value={newTaskDeadline}
                        onChange={(e) => setNewTaskDeadline(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="hero-meta ml-1">담당자 지정</label>
                    <div className="flex flex-wrap gap-2 p-2 bg-white dark:bg-[#12182B] rounded-2xl border border-gray-300 dark:border-white/10 min-h-[60px]">
                      {projectMembers.length > 0 ? (
                        projectMembers.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              const email = m.email;
                              setSelectedAssignees(prev => 
                                prev.includes(email) 
                                  ? prev.filter(e => e !== email) 
                                  : [...prev, email]
                              );
                            }}
                            className={`group relative flex items-center justify-center w-10 h-10 rounded-xl font-black text-[14px] transition-all ${
                              selectedAssignees.includes(m.email)
                                ? "bg-[#7C6CFF] text-white ring-4 ring-[#7C6CFF]/20"
                                : "bg-gray-100 dark:bg-white/5 text-[#7D879C] hover:bg-gray-200 dark:hover:bg-white/10"
                            }`}
                          >
                            {m.name[0]}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#1A2340] text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-50">
                              {m.name}
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="text-[11px] text-[#7D879C] m-auto">불러올 수 있는 멤버가 없습니다.</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="hero-meta ml-1">우선순위</label>
                    <div className="flex bg-white dark:bg-[#12182B] p-1.5 rounded-2xl border border-gray-300 dark:border-white/10">
                      {(["high", "medium", "low"] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => setNewTaskPriority(p)}
                          className={`flex-1 py-2.5 rounded-xl text-[11px] font-black transition-all ${newTaskPriority === p 
                            ? getPriorityColor(p) + " border-none"
                            : "text-[#7D879C]/80 dark:text-white/40 hover:text-[#1A2340] dark:text-white"
                          }`}
                        >
                          {getPriorityLabel(p)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleAddTask}
                    disabled={!newTaskTitle.trim()}
                    className="w-full py-5 bg-[#7C6CFF] text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(124,108,255,0.3)] disabled:bg-white/50 dark:bg-white/5 disabled:text-gray-300 dark:text-white/20 disabled:shadow-none transition-all active:scale-[0.98] border border-[#7C6CFF]/50 disabled:border-transparent text-[14px]"
                  >
                    태스크 생성하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}