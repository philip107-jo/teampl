import { Plus, Filter, CheckCircle2, Circle, Clock, AlertCircle, X, LayoutGrid, List as ListIcon, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { initialMembers, currentUser } from "../mockData";
import { Task, TaskStatus } from "../types";
import KanbanBoard from "../components/KanbanBoard";
import { taskApi } from "../api/taskApi";

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const data = await taskApi.getTasks();
      setTasks(data);
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "all") return true;
    return task.status === filter;
  });

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    
    const title = newTaskTitle;
    setIsModalOpen(false);
    setNewTaskTitle("");
    
    try {
      const newTask = await taskApi.createTask({
        title,
        workspaceId: 'workspace-1',
        createdById: currentUser.id,
        assignees: [currentUser.id]
      });
      setTasks([newTask, ...tasks]);
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const toggleTaskStatus = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    
    // Optimistic Update
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    
    try {
      await taskApi.updateTaskStatus(id, newStatus);
    } catch (e) {
      console.error("Failed to update status:", e);
      // rollback
      setTasks(tasks.map(t => t.id === id ? { ...t, status: task.status } : t));
    }
  };

  const moveTask = async (taskId: string, targetStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    const oldStatus = task.status;
    
    // Optimistic Update
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: targetStatus } : t));
    
    try {
      await taskApi.updateTaskStatus(taskId, targetStatus);
    } catch (e) {
      console.error("Failed to move task:", e);
      // rollback
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: oldStatus } : t));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-50 border-red-200";
      case "medium": return "text-orange-600 bg-orange-50 border-orange-200";
      case "low": return "text-blue-600 bg-blue-50 border-blue-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DONE": return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "IN_PROGRESS": return <Clock className="w-5 h-5 text-blue-600" />;
      default: return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-full space-y-6 p-4 max-w-5xl mx-auto pb-24">
        <div className="flex items-center justify-between flex-shrink-0 mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">태스크 보드</h1>
            <p className="text-sm text-gray-400 font-medium mt-1">드래그하여 상태를 변경하세요</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100/50 p-1 rounded-2xl">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-xl transition-all ${viewMode === "list" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                title="리스트 뷰"
              >
                <ListIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("board")}
                className={`p-2 rounded-xl transition-all ${viewMode === "board" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                title="칸반 보드"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" />
              추가
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 animate-in fade-in duration-500">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-gray-500 font-bold text-sm tracking-tight">태스크 정보를 불러오는 중입니다...</p>
          </div>
        ) : viewMode === "list" ? (
          <>
            {/* Filters (List View Only) */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide flex-shrink-0">
              {["all", "TODO", "IN_PROGRESS", "DONE"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${filter === f
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                      : "bg-white text-gray-400 border border-transparent hover:border-gray-100"
                    }`}
                >
                  {f === "all" ? "전체" : f === "TODO" ? "대기" : f === "IN_PROGRESS" ? "진행중" : "완료"} (
                  {f === "all" ? tasks.length : tasks.filter(t => t.status === f).length})
                </button>
              ))}
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-12 scrollbar-hide">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTaskStatus(task.id)}
                  className={`bg-white rounded-[24px] p-5 shadow-sm border border-gray-50 hover:shadow-md transition-all cursor-pointer group flex items-start gap-5 ${task.status === 'DONE' ? 'opacity-60' : ''}`}
                >
                  <div className="mt-1 flex-shrink-0 group-hover:scale-110 transition-transform">{getStatusIcon(task.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className={`font-bold text-[15px] text-gray-900 leading-tight ${task.status === 'DONE' ? 'line-through' : ''}`}>
                        {task.title}
                      </h3>
                      <div className="flex -space-x-1.5">
                        {task.assignees.map((uid) => (
                          <div key={uid} className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-500 text-[9px] font-bold">
                            {initialMembers.find(m => m.id === uid)?.name[0]}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                        {task.priority === 'high' ? '높음' : task.priority === 'medium' ? '중간' : '낮음'}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5" />
                        {task.deadline}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Kanban Board Content */
          <div className="flex-1 overflow-hidden min-h-0">
            <KanbanBoard tasks={tasks} onMoveTask={moveTask} onToggleTask={toggleTaskStatus} />
          </div>
        )}

        {/* Add Task Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/30 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-8 animate-in slide-in-from-bottom-10">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">새 태스크 추가</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-2xl transition-all">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">태스크 이름</label>
                  <input
                    type="text"
                    placeholder="무엇을 완료해야 하나요?"
                    autoFocus
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder:text-gray-300 font-medium"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  />
                </div>
                <button
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim()}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 disabled:bg-gray-200 disabled:shadow-none transition-all active:scale-[0.98]"
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