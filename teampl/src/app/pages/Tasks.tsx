import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import {
  Plus, Sparkles, Trash2, User, CalendarIcon,
  Circle, ArrowRight, Eye, CheckCircle2, GripVertical
} from "lucide-react";
import { Task, TaskStatus } from "../types";
import { taskApi } from "../api/taskApi";
import { projectApi } from "../api/projectApi";
import { useAuth } from "../context/AuthContext";
import { socket, joinProjectChannel } from "../socket";
import TaskDetailModal from "../components/TaskDetailModal";
import TaskCreateModal from "../components/TaskCreateModal";
import AiTaskSplitModal from "../components/AiTaskSplitModal";

interface TasksProps {
  projectId?: number;
}

const COLUMNS: { status: TaskStatus; label: string; color: string; bg: string; dot: string }[] = [
  { status: "TODO",        label: "할 일",   color: "text-gray-500",    bg: "bg-gray-50 dark:bg-white/5",              dot: "bg-gray-400" },
  { status: "IN_PROGRESS", label: "진행 중", color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-500/10",          dot: "bg-blue-500" },
  { status: "IN_REVIEW",   label: "검토 중", color: "text-purple-500",  bg: "bg-purple-50 dark:bg-purple-500/10",      dot: "bg-purple-500" },
  { status: "DONE",        label: "완료",    color: "text-[#11B886]",   bg: "bg-[#11B886]/5 dark:bg-[#11B886]/10",    dot: "bg-[#11B886]" },
];

const PRIORITY_CONFIG: Record<string, { label: string; cls: string }> = {
  high:   { label: "긴급", cls: "text-red-500 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20" },
  medium: { label: "보통", cls: "text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20" },
  low:    { label: "여유", cls: "text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20" },
};

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  TODO: "IN_PROGRESS",
  IN_PROGRESS: "IN_REVIEW",
  IN_REVIEW: "DONE",
  DONE: "TODO",
};

export default function Tasks({ projectId: propProjectId }: TasksProps = {}) {
  const params = useParams();
  const numProjectId = propProjectId || Number(params.projectId);
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createStatus, setCreateStatus] = useState<TaskStatus | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // 드래그 상태
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  const currentUserMember = members.find(m => m.email === user?.email);
  const isLeader = currentUserMember?.role === "LEADER";

  const fetchData = async () => {
    if (!numProjectId) return;
    try {
      const [tasksData, projects] = await Promise.all([
        taskApi.getTasks(numProjectId),
        projectApi.getProjects(),
      ]);
      setTasks(tasksData);
      const p = projects.find(proj => String(proj.id) === String(numProjectId));
      setMembers(p?.membersList?.length ? p.membersList : [{ email: user?.email, name: user?.name }]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    joinProjectChannel(numProjectId);
    const onUpdate = () => fetchData();
    socket.on("taskUpdated", onUpdate);
    return () => { socket.off("taskUpdated", onUpdate); };
  }, [numProjectId]);

  const updateStatus = async (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await taskApi.updateTaskStatus(numProjectId, taskId, newStatus);
    } catch {
      fetchData(); // 실패 시 원복
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("이 과제를 삭제하시겠습니까?")) return;
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await taskApi.deleteTask(numProjectId, taskId);
  };

  // 드래그 앤 드롭
  const onDragStart = (e: React.DragEvent, taskId: string) => {
    setDragTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOverCol(status);
  };
  const onDrop = async (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (dragTaskId && dragTaskId !== "") {
      const task = tasks.find(t => t.id === dragTaskId);
      if (task && task.status !== status) await updateStatus(dragTaskId, status);
    }
    setDragTaskId(null);
    setDragOverCol(null);
  };

  const getMemberName = (email: string) => {
    const m = members.find(m => m.email === email);
    return m?.name || email.split("@")[0];
  };

  return (
    <div className="pt-2 pb-8 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[18px] font-black text-[#1A2340] dark:text-white">과제 관리</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#7C6CFF] hover:bg-[#6A5BDB] text-white rounded-full text-sm font-bold transition-all shadow-[0_0_15px_rgba(124,108,255,0.3)]"
          >
            <Sparkles className="w-4 h-4" />
            AI 업무 분할
          </button>
          <button
            onClick={() => setCreateStatus("TODO")}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#11B886] hover:bg-[#0EA271] text-white rounded-full text-sm font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
            과제 추가
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#11B886]/20 border-t-[#11B886] rounded-full animate-spin" />
        </div>
      ) : (
        /* 4컬럼 칸반 보드 */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.status);
            const isOver = dragOverCol === col.status;

            return (
              <div
                key={col.status}
                onDragOver={e => onDragOver(e, col.status)}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={e => onDrop(e, col.status)}
                className={`flex flex-col rounded-2xl transition-all ${isOver ? "ring-2 ring-[#11B886] ring-offset-2" : ""}`}
              >
                {/* 컬럼 헤더 */}
                <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl ${col.bg}`}>
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                    <span className={`text-[13px] font-black uppercase tracking-widest ${col.color}`}>
                      {col.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${col.bg} ${col.color} border border-current/20`}>
                      {colTasks.length}
                    </span>
                    <button
                      onClick={() => setCreateStatus(col.status)}
                      className={`p-1 rounded-lg hover:bg-black/5 transition-colors ${col.color}`}
                      title="이 열에 과제 추가"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 태스크 카드 목록 */}
                <div className={`flex flex-col gap-2 p-2 min-h-[120px] rounded-b-2xl ${col.bg} transition-colors`}>
                  {colTasks.length === 0 ? (
                    <div
                      className="flex-1 flex items-center justify-center py-8 text-[12px] font-bold text-gray-400 dark:text-white/20 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl cursor-pointer"
                      onClick={() => setCreateStatus(col.status)}
                    >
                      + 여기에 추가
                    </div>
                  ) : (
                    colTasks.map(task => {
                      const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                      const assignee = task.assignees?.[0] ? getMemberName(task.assignees[0]) : "미지정";
                      const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "DONE";

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={e => onDragStart(e, task.id)}
                          onDragEnd={() => { setDragTaskId(null); setDragOverCol(null); }}
                          onClick={() => setSelectedTask(task)}
                          className={`bg-white dark:bg-[#1A2340] rounded-xl p-4 border shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all group select-none
                            ${dragTaskId === task.id ? "opacity-40 scale-95" : "opacity-100"}
                            ${isOverdue ? "border-red-200 dark:border-red-500/20" : "border-gray-100 dark:border-white/10"}`}
                        >
                          {/* 우선순위 + 드래그 핸들 */}
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${pCfg.cls}`}>
                              {pCfg.label}
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={e => { e.stopPropagation(); updateStatus(task.id, NEXT_STATUS[task.status]); }}
                                className="p-1 text-gray-400 hover:text-[#11B886] rounded-lg hover:bg-[#11B886]/10 transition-colors"
                                title={`→ ${COLUMNS.find(c => c.status === NEXT_STATUS[task.status])?.label}`}
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                              {isLeader && (
                                <button
                                  onClick={e => { e.stopPropagation(); deleteTask(task.id); }}
                                  className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <GripVertical className="w-3.5 h-3.5 text-gray-300 dark:text-white/20" />
                            </div>
                          </div>

                          {/* 제목 */}
                          <h3 className={`text-[13px] font-bold leading-snug mb-2 ${task.status === "DONE" ? "line-through text-gray-400 dark:text-white/30" : "text-[#1A2340] dark:text-white"}`}>
                            {task.title}
                          </h3>

                          {task.description && (
                            <p className="text-[11px] text-gray-400 dark:text-white/30 mb-3 line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {/* 담당자 + 마감일 */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-[#11B886]/10 text-[#11B886] flex items-center justify-center text-[9px] font-black">
                                {assignee[0]?.toUpperCase()}
                              </div>
                              <span className="text-[11px] text-gray-500 dark:text-white/40 font-medium truncate max-w-[80px]">
                                {assignee}
                              </span>
                            </div>
                            {task.deadline && (
                              <span className={`text-[10px] font-bold ${isOverdue ? "text-red-500" : "text-gray-400 dark:text-white/30"}`}>
                                {task.deadline}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 모달들 */}
      {selectedTask && (
        <TaskDetailModal
          projectId={numProjectId}
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={async () => {
            const data = await taskApi.getTasks(numProjectId);
            setTasks(data);
            const updated = data.find(t => t.id === selectedTask.id);
            if (updated) setSelectedTask(updated);
          }}
        />
      )}

      {createStatus && (
        <TaskCreateModal
          projectId={numProjectId}
          assigneeEmail={user?.email || ""}
          assigneeName={user?.name || ""}
          initialStatus={createStatus}
          onClose={() => setCreateStatus(null)}
          onCreate={async () => {
            const data = await taskApi.getTasks(numProjectId);
            setTasks(data);
          }}
        />
      )}

      {numProjectId && (
        <AiTaskSplitModal
          projectId={numProjectId}
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          onSuccess={() => {
            setIsAiModalOpen(false);
            taskApi.getTasks(numProjectId).then(setTasks);
          }}
        />
      )}
    </div>
  );
}
