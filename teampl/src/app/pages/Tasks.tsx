import React, { useState, useEffect } from "react";
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

  const DEFAULT_STAGES = [
    { id: 1, title: '1단계 · 주제 선정' },
    { id: 2, title: '2단계 · 설문 설계' },
    { id: 3, title: '3단계 · 데이터 수집' },
    { id: 4, title: '4단계 · 분석' },
    { id: 5, title: '5단계 · 발표준비' }
  ];

  const getTaskStageId = (task: any) => {
    const text = `${task.title || ''} ${task.description || ''}`.toLowerCase();
    if (text.includes('[1단계]') || text.includes('1단계') || text.includes('[stage1]')) return 1;
    if (text.includes('[2단계]') || text.includes('2단계') || text.includes('[stage2]')) return 2;
    if (text.includes('[3단계]') || text.includes('3단계') || text.includes('[stage3]')) return 3;
    if (text.includes('[4단계]') || text.includes('4단계') || text.includes('[stage4]')) return 4;
    if (text.includes('[5단계]') || text.includes('5단계') || text.includes('[stage5]')) return 5;
    
    const keywords = [
      ['주제', '가설', '기획', '아이디어', '목표', '선정', '범위', '기본', '주제선정'],
      ['설문', '인터뷰', '질문', '설계', '피드백', '질의', '문항', '설문지'],
      ['수집', '배포', '응답', '확보', '설문조사', '크롤링', '획득', '데이터', '자료', '조사', '논문'],
      ['분석', 'spss', '통계', '결과', '코딩', '분석 진행', '차트', '해석', '검증'],
      ['발표', 'ppt', '대본', '스크립트', '제작', '피피티', '녹음', '연습', '최종', '발표준비']
    ];
    for (let i = keywords.length - 1; i >= 0; i--) {
      if (keywords[i].some(k => text.includes(k))) {
        return i + 1;
      }
    }
    return 1;
  };

  return (
    <div className="pt-2 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[18px] font-black text-[#1A2340] dark:text-white">과제 관리</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#7C6CFF] hover:bg-[#6A5BDB] text-white rounded-full text-sm font-bold transition-all shadow-[0_0_15px_rgba(124,108,255,0.4)]"
          >
            <Sparkles className="w-4 h-4" />
            AI 업무 분할
          </button>
          <button 
            onClick={() => setCreateModalAssignee({ email: user?.email || '', name: user?.name || '' })}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#11B886] hover:bg-[#0EA271] text-white rounded-full text-sm font-bold transition-all border-none"
          >
            <Plus className="w-4 h-4" />
            과제 추가
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#11B886]/20 border-t-[#11B886] rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {DEFAULT_STAGES.map(stage => {
            const stageTasks = tasks.filter(t => getTaskStageId(t) === stage.id);
            return (
              <div key={stage.id} className="space-y-3 bg-[#F8FAFC] dark:bg-white/5 rounded-2xl p-5 border border-slate-100 dark:border-white/5">
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/5">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#11B886]" />
                    {stage.title}
                  </h3>
                  <span className="text-xs font-semibold text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-100 dark:border-white/5">
                    {stageTasks.length}개 과제
                  </span>
                </div>
                
                {/* Stage Tasks list */}
                <div className="space-y-3">
                  {stageTasks.length > 0 ? (
                    stageTasks.map(task => {
                      let statusColor = "text-gray-500 bg-gray-100 dark:bg-white/5";
                      let statusLabel = "할 일";
                      if (task.status === "DONE") {
                        statusColor = "text-[#11B886] bg-[#11B886]/10";
                        statusLabel = "완료";
                      } else if (task.status === "IN_PROGRESS") {
                        statusColor = "text-amber-600 bg-amber-50 dark:bg-amber-500/10";
                        statusLabel = "진행 중";
                      }

                      const assignee = members.find(m => task.assignees.includes(m.email))?.name || task.assignees[0]?.split('@')[0] || "미지정";

                      return (
                        <div 
                          key={task.id} 
                          className="bg-white dark:bg-[#12182B] rounded-[14px] px-6 py-5 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-row items-center justify-between gap-4"
                          onClick={() => setSelectedTask(task)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1.5">
                              <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">{task.title}</h3>
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${statusColor}`}>
                                {statusLabel}
                              </span>
                            </div>
                            <p className="text-[13px] text-gray-500 dark:text-white/40 mb-3">{task.description || "설명 없음"}</p>
                            
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
                    })
                  ) : (
                    <p className="text-gray-400 text-xs py-3 pl-4 italic">이 단계에 등록된 과제가 없습니다.</p>
                  )}
                </div>
              </div>
            );
          })}
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
