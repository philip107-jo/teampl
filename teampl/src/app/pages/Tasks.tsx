import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import {
  Plus, Sparkles, Trash2, User, CalendarIcon,
  Circle, ArrowRight, Eye, CheckCircle2, GripVertical, CheckCheck
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
  medium: { label: "보통", cls: "text-amber-500 bg-amber-55 dark:bg-amber-550/10 border-amber-200 dark:border-amber-550/20" },
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
  const [viewMode, setViewMode] = useState<"workflow" | "kanban">("workflow");

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
        <div className="flex items-center gap-4">
          <h2 className="text-[18px] font-black text-[#1A2340] dark:text-white">과제 관리</h2>
          <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("workflow")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "workflow"
                  ? "bg-white dark:bg-[#12182B] text-[#11B886] shadow-sm font-black"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              단계별 워크플로우
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-[#12182B] text-[#11B886] shadow-sm font-black"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              칸반 보드
            </button>
          </div>
        </div>
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
        viewMode === "workflow" ? (
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
                        } else if (task.status === "IN_REVIEW") {
                          statusColor = "text-purple-600 bg-purple-50 dark:bg-purple-500/10";
                          statusLabel = "검토 중";
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
                                  else if (task.status === "IN_PROGRESS") nextStatus = "IN_REVIEW";
                                  else if (task.status === "IN_REVIEW") nextStatus = "DONE";
                                  else if (task.status === "DONE") nextStatus = "TODO";
                                  
                                  // Optimistic update
                                  setTasks(tasks.map(t => t.id === task.id ? { ...t, status: nextStatus as TaskStatus } : t));
                                  
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
        )
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
