import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { 
  ChevronLeft, Trophy, Calendar as CalendarIcon, 
  PlayCircle, CheckCircle2, ArrowRight, Plus, 
  TrendingUp, User, Trash2, CheckCheck, Sparkles
} from "lucide-react";
import { socket, joinProjectChannel } from "../socket";
import { Task } from "../types";
import { taskApi } from "../api/taskApi";
import { projectApi } from "../api/projectApi";
import { useAuth } from "../context/AuthContext";
import TaskDetailModal from "../components/TaskDetailModal";
import TaskCreateModal from "../components/TaskCreateModal";
import AiTaskSplitModal from "../components/AiTaskSplitModal";

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
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

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

  const memberGroupedTasks = useMemo(() => {
    if (!members.length) return [];

    const map: { [email: string]: Task[] } = {};
    const unassigned: Task[] = [];

    members.forEach(m => {
      map[m.email] = [];
    });

    tasks.forEach(task => {
      let assigned = false;
      if (task.assignees && task.assignees.length > 0) {
        task.assignees.forEach(email => {
          if (map[email]) {
            map[email].push(task);
            assigned = true;
          }
        });
      }
      if (!assigned) {
        unassigned.push(task);
      }
    });

    const list = members.map(m => ({
      member: m,
      tasks: map[m.email] || []
    }));

    if (unassigned.length > 0) {
      list.push({
        member: {
          id: -999,
          name: "미지정",
          avatarColor: "bg-gray-400",
          email: "unassigned",
          role: "MEMBER"
        },
        tasks: unassigned
      });
    }

    return list;
  }, [tasks, members]);

  return (
    <div className="pt-2 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-[18px] font-black text-[#1A2340] dark:text-white">과제 관리</h2>
          <p className="text-xs text-gray-400 dark:text-white/40 mt-1">팀원들의 할 일을 이름별로 확인하고 관리하세요.</p>
        </div>
        <button 
          onClick={() => setCreateModalAssignee({ email: user?.email || '', name: user?.name || '' })}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-[#11B886] hover:bg-[#0EA271] text-white rounded-xl text-sm font-bold transition-all border-none shadow-sm animate-in fade-in duration-200"
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
        <div className="space-y-6">
          {memberGroupedTasks.length > 0 ? (
            memberGroupedTasks.map(({ member, tasks: memberTasks }) => {
              const isUnassigned = member.id === -999;
              return (
                <div 
                  key={member.email} 
                  className="bg-white dark:bg-[#132038] rounded-2xl p-6 border border-gray-100 dark:border-white/5 shadow-sm space-y-4"
                >
                  {/* Group Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white bg-[#11B886] text-xs shadow-sm`}>
                        {member.name[0]}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                          {member.name}
                          {member.role === 'LEADER' && (
                            <span className="text-[9px] font-bold text-[#FFB547] bg-[#FFB547]/10 px-1.5 py-0.5 rounded border border-[#FFB547]/20">방장</span>
                          )}
                        </h4>
                        {!isUnassigned && <p className="text-[11px] text-gray-400 dark:text-white/40">{member.email}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[#11B886] bg-[#11B886]/10 px-2.5 py-0.5 rounded-full border border-[#11B886]/20">
                        과제 {memberTasks.length}개
                      </span>
                      {!isUnassigned && (
                        <button 
                          onClick={() => setCreateModalAssignee({ email: member.email, name: member.name })}
                          className="p-1 hover:bg-[#11B886]/10 text-gray-400 hover:text-[#11B886] rounded-lg transition-all ml-1"
                          title="이 담당자에게 과제 추가"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Group Tasks */}
                  <div className="space-y-3">
                    {memberTasks.length > 0 ? (
                      memberTasks.map(task => {
                        let statusColor = "text-gray-500 bg-gray-100 dark:bg-white/5";
                        let statusLabel = "할 일";
                        if (task.status === "DONE") {
                          statusColor = "text-[#11B886] bg-[#11B886]/10";
                          statusLabel = "완료";
                        } else if (task.status === "IN_PROGRESS") {
                          statusColor = "text-amber-600 bg-amber-50 dark:bg-amber-500/10";
                          statusLabel = "진행 중";
                        }

                        return (
                          <div 
                            key={task.id} 
                            className="bg-gray-50/50 dark:bg-[#12182B] rounded-xl px-5 py-4 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-row items-center justify-between gap-4"
                            onClick={() => setSelectedTask(task)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2.5 mb-1">
                                <h5 className={`text-[14px] font-bold truncate ${task.status === 'DONE' ? 'line-through text-gray-400 dark:text-white/20' : 'text-gray-900 dark:text-white'}`}>
                                  {task.title}
                                </h5>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusColor}`}>
                                  {statusLabel}
                                </span>
                              </div>
                              <p className="text-[12px] text-gray-500 dark:text-white/40 truncate">{task.description || "설명 없음"}</p>
                              
                              <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium mt-2">
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="w-3 h-3" />
                                  마감: {task.deadline}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
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
                                className="p-1.5 text-gray-400 hover:text-[#11B886] hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
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
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-6 flex flex-col items-center justify-center border border-dashed border-gray-100 dark:border-white/5 rounded-xl bg-gray-50/20 dark:bg-transparent">
                        <p className="text-gray-400 text-xs font-bold">등록된 과제가 없습니다.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
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

      {/* AI Task Split Modal */}
      {numProjectId && (
        <AiTaskSplitModal
          projectId={numProjectId}
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          onSuccess={() => {
            setIsAiModalOpen(false);
            // Re-fetch tasks after successful batch creation
            taskApi.getTasks(numProjectId).then(setTasks);
          }}
        />
      )}
    </div>
  );
}

