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
import TaskColumn from "../components/TaskColumn";

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
            const colTasks = tasks.filter(t => t.status === col.status).map(t => ({
              ...t,
              assignees: t.assignees?.map(email => getMemberName(email)) || []
            }));

            return (
              <TaskColumn
                key={col.status}
                col={col}
                colTasks={colTasks}
                isLeader={isLeader}
                priorityConfig={PRIORITY_CONFIG}
                nextStatus={NEXT_STATUS}
                columnsConfig={COLUMNS}
                updateStatus={updateStatus}
                deleteTask={deleteTask}
                setSelectedTask={setSelectedTask}
                setCreateStatus={setCreateStatus}
              />
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
