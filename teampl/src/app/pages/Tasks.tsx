import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { 
  ChevronLeft, Trophy, Calendar as CalendarIcon, 
  PlayCircle, CheckCircle2, ArrowRight, Plus, 
  TrendingUp, User, Trash2, CheckCheck
} from "lucide-react";
import { socket, joinProjectChannel } from "../socket";
import { Task } from "../types";
import { taskApi } from "../api/taskApi";
import { projectApi } from "../api/projectApi";
import { useAuth } from "../context/AuthContext";
import TaskDetailModal from "../components/TaskDetailModal";
import TaskCreateModal from "../components/TaskCreateModal";

interface TasksProps {
  projectId?: number;
}

export default function Tasks({ projectId: propProjectId }: TasksProps = {}) {
  const params = useParams();
  const numProjectId = propProjectId || Number(params.projectId);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [projectStats, setProjectStats] = useState<any[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createModalAssignee, setCreateModalAssignee] = useState<{email: string, name: string} | null>(null);

  const currentUserMember = members.find(m => m.email === user?.email);
  const isLeader = currentUserMember?.role === 'LEADER';

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!numProjectId) return;
        const tasksData = await taskApi.getTasks(numProjectId);
        setTasks(tasksData);

        const projects = await projectApi.getProjects();
        const p = projects.find(proj => String(proj.id) === String(numProjectId));
        if (p && p.membersList && p.membersList.length > 0) {
          setMembers(p.membersList);
        } else {
          setMembers([{ id: user?.id || 1, name: user?.name || "나", avatarColor: "bg-[#11B886]", email: user?.email }]);
        }

        const statsData = await projectApi.getProjectStats(numProjectId);
        setProjectStats(statsData);
      } catch(err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    
    // 실시간 업데이트 구독
    joinProjectChannel(numProjectId);
    const onTaskUpdated = () => {
      console.log("실시간 태스크 업데이트! 보드 리로드...");
      fetchData();
    };
    socket.on('taskUpdated', onTaskUpdated);

    return () => {
      socket.off('taskUpdated', onTaskUpdated);
    };
  }, [numProjectId, user]);


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

  return (
    <div className="pt-2 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[18px] font-black text-[#1A2340] dark:text-white">과제 관리</h2>
        <button 
          onClick={() => setCreateModalAssignee({ email: user?.email || '', name: user?.name || '' })}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#11B886] hover:bg-[#0EA271] text-white rounded-full text-sm font-bold transition-all border-none"
        >
          <Plus className="w-4 h-4" />
          과제 추가
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#11B886]/20 border-t-[#11B886] rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.length > 0 ? tasks.map(task => {
            let statusColor = "text-gray-500 bg-gray-100";
            let statusLabel = "할 일";
            if (task.status === "DONE") {
              statusColor = "text-[#11B886] bg-[#11B886]/10";
              statusLabel = "완료";
            } else if (task.status === "IN_PROGRESS") {
              statusColor = "text-[#11B886]";
              statusLabel = "진행 중";
            }

            const assignee = members.find(m => task.assignees.includes(m.email))?.name || task.assignees[0]?.split('@')[0] || "미지정";

            return (
              <div 
                key={task.id} 
                className="bg-white rounded-[14px] px-6 py-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-row items-center justify-between gap-4"
                onClick={() => setSelectedTask(task)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="text-[15px] font-bold text-gray-900">{task.title}</h3>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <p className="text-[13px] text-gray-500 mb-3">{task.description || "설명 없음"}</p>
                  
                  <div className="flex items-center gap-4 text-[12px] text-gray-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      담당: {assignee}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      마감: {task.deadline}
                    </div>
                  </div>
                </div>

                {/* Right side Actions */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={async (e) => { 
                      e.stopPropagation(); 
                      let nextStatus = "IN_PROGRESS";
                      if (task.status === "TODO") nextStatus = "IN_PROGRESS";
                      else if (task.status === "IN_PROGRESS") nextStatus = "DONE";
                      else if (task.status === "DONE") nextStatus = "TODO";
                      
                      // Optimistic update
                      setTasks(tasks.map(t => t.id === task.id ? { ...t, status: nextStatus } : t));
                      
                      try {
                        await taskApi.updateTaskStatus(numProjectId, task.id, nextStatus as any);
                      } catch (error) {
                        console.error("Failed to update status", error);
                        // Revert on failure
                        setTasks(tasks.map(t => t.id === task.id ? { ...t, status: task.status } : t));
                      }
                    }}
                    className="p-1.5 text-gray-400 hover:text-[#11B886] transition-colors"
                    title="상태 변경"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                  {isLeader && (
                    <button 
                      onClick={async (e) => { 
                        e.stopPropagation(); 
                        if (confirm('이 과제를 삭제하시겠습니까?')) {
                          await taskApi.deleteTask(numProjectId, task.id);
                          setTasks(tasks.filter(t => t.id !== task.id));
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          }) : (
             <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-2xl">
               <p className="text-gray-400 text-sm font-bold">등록된 과제가 없습니다.</p>
             </div>
          )}
        </div>
      )}

      {selectedTask && (
        <TaskDetailModal 
          projectId={numProjectId} 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)}
          onUpdate={async () => {
             const tasksData = await taskApi.getTasks(numProjectId);
             setTasks(tasksData);
             const updatedTask = tasksData.find(t => t.id === selectedTask.id);
             if (updatedTask) setSelectedTask(updatedTask);
          }}
        />
      )}

      {createModalAssignee && (
        <TaskCreateModal
          projectId={numProjectId}
          assigneeEmail={createModalAssignee.email}
          assigneeName={createModalAssignee.name}
          onClose={() => setCreateModalAssignee(null)}
          onCreate={async () => {
            const tasksData = await taskApi.getTasks(numProjectId);
            setTasks(tasksData);
          }}
        />
      )}
    </div>
  );
}
