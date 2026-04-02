import { Plus, Filter, CheckCircle2, Circle, Clock, AlertCircle, X, LayoutGrid, List as ListIcon, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { initialMembers, currentUser } from "../mockData";
import { Task, TaskStatus } from "../types";
import KanbanBoard from "../components/KanbanBoard";
import { taskApi } from "../api/taskApi";

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    taskApi.getTasks()
      .then(data => setTasks(data))
      .catch(err => console.error("태스크 로드 에러:", err));
  }, []);
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      const newTask = await taskApi.createTask({
        workspaceId: 'workspace-1',
        title: newTaskTitle,
        status: 'TODO',
        priority: 'medium',
        deadline: new Date().toISOString().split('T')[0],
        createdById: currentUser.id,
        assignees: [currentUser.id]
      });
      setTasks([newTask, ...tasks]);
      setNewTaskTitle("");
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("태스크 추가 실패!");
    }
  };

  const toggleTaskStatus = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const target = task.status === 'DONE' ? 'TODO' : 'DONE';
    try {
      await taskApi.updateTaskStatus(id, target);
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
      await taskApi.deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      console.error(err);
      alert("태스크 삭제에 실패했습니다.");
    }
  };

  const moveTask = async (taskId: string, targetStatus: TaskStatus) => {
    try {
      await taskApi.updateTaskStatus(taskId, targetStatus);
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));
    } catch (e) {
      console.error(e);
      alert("카드 이동 실패!");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-[#FF6B7A] bg-[#FF6B7A]/10 border-[#FF6B7A]/20";
      case "medium": return "text-[#FFB547] bg-[#FFB547]/10 border-[#FFB547]/20";
      case "low": return "text-[#7C6CFF] bg-[#7C6CFF]/10 border-[#7C6CFF]/20";
      default: return "text-[#7D879C]/80 dark:text-white/40 bg-white/50 dark:bg-white/5 border-gray-300 dark:border-white/10";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DONE": return (
        <div className="w-8 h-8 rounded-[12px] bg-[#23D7A1]/10 flex items-center justify-center border border-[#23D7A1]/20 shadow-[0_0_15px_rgba(35,215,161,0.2)]">
          <CheckCircle2 className="w-5 h-5 text-[#23D7A1]" />
        </div>
      );
      case "IN_PROGRESS": return (
        <div className="w-8 h-8 rounded-[12px] bg-[#7C6CFF]/10 flex items-center justify-center border border-[#7C6CFF]/20 shadow-[0_0_15px_rgba(124,108,255,0.2)]">
          <Clock className="w-5 h-5 text-[#7C6CFF]" />
        </div>
      );
      default: return (
        <div className="w-8 h-8 rounded-[12px] bg-white/50 dark:bg-white/5 flex items-center justify-center border border-gray-300 dark:border-white/10">
          <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
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
                        <h3 className={`font-black text-[16px] tracking-tight truncate mb-1.5 transition-colors ${task.status === 'DONE' ? 'line-through text-[#7D879C]/80 dark:text-white/40' : 'text-[#1A2340] dark:text-white group-hover:text-[#7C6CFF]'}`}>
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-4">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-[8px] uppercase tracking-widest border ${getPriorityColor(task.priority)}`}>
                            {task.priority === 'high' ? 'HIGH PRIORITY' : task.priority === 'medium' ? 'NORMAL' : 'LOW'}
                          </span>
                          <span className="text-[10px] text-[#7D879C]/80 dark:text-white/40 font-black uppercase tracking-widest flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {task.deadline}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 border-l border-gray-200 dark:border-white/10 pl-4 ml-2">
                        <div className="flex -space-x-2 hover:space-x-1 transition-all pr-2">
                          {task.assignees.map((uid) => (
                            <div key={uid} className="w-8 h-8 rounded-full bg-white/40 dark:bg-[#1A2340] border-2 border-[#12182B] flex items-center justify-center text-[#7D879C] dark:text-white/80 text-[10px] font-black uppercase shadow-sm">
                              {initialMembers.find(m => m.id === uid)?.name[0]}
                            </div>
                          ))}
                        </div>
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
            <KanbanBoard tasks={tasks} onMoveTask={moveTask} onToggleTask={toggleTaskStatus} onDeleteTask={handleDeleteTask} />
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
                <div className="space-y-2">
                  <label className="hero-meta ml-1">태스크 이름</label>
                  <input
                    type="text"
                    placeholder="무엇을 완료해야 하나요?"
                    autoFocus
                    className="w-full px-6 py-5 bg-white dark:bg-[#12182B] border border-gray-300 dark:border-white/10 rounded-2xl focus:border-[#7C6CFF] focus:shadow-[0_0_15px_rgba(124,108,255,0.2)] focus:bg-white/40 dark:bg-[#1A2340] outline-none transition-all placeholder-white/20 font-black text-[#1A2340] dark:text-white"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  />
                </div>
                <button
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim()}
                  className="w-full py-5 bg-[#7C6CFF] text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_0_20px_rgba(124,108,255,0.3)] disabled:bg-white/50 dark:bg-white/5 disabled:text-gray-300 dark:text-white/20 disabled:shadow-none transition-all active:scale-[0.98] border border-[#7C6CFF]/50 disabled:border-transparent"
                >
                  태스크 생성하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}