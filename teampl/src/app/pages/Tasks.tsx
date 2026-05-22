import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { 
  ChevronLeft, Trophy, PlayCircle, Plus, 
  TrendingUp, CheckCheck, Sparkles,
  Award, Paperclip, Check, Trash2, Calendar as CalendarIcon
} from "lucide-react";
import { socket, joinProjectChannel } from "../socket";
import { Task, TaskStatus } from "../types";
import { taskApi } from "../api/taskApi";
import { projectApi } from "../api/projectApi";
import { useAuth } from "../context/AuthContext";
import TaskDetailModal from "../components/TaskDetailModal";
import TaskCreateModal from "../components/TaskCreateModal";
import AiTaskSplitModal from "../components/AiTaskSplitModal";
import TaskSubmitModal from "../components/TaskSubmitModal";
import { getMemberName } from "../utils/members";

interface TasksProps {
  projectId?: number;
}

const DEFAULT_STAGES = [
  {
    id: 1,
    title: '주제 선정',
    description: '조사 주제 및 가설 수립',
    keywords: ['주제', '가설', '기획', '아이디어', '목표', '선정', '범위', '기본', '주제선정'],
  },
  {
    id: 2,
    title: '설문 설계',
    description: '설문지 및 인터뷰 문항 작성',
    keywords: ['설문', '인터뷰', '질문', '설계', '피드백', '질의', '문항', '설문지'],
  },
  {
    id: 3,
    title: '데이터 수집',
    description: '설문 배포 및 응답 확보',
    keywords: ['수집', '배포', '응답', '확보', '설문조사', '크롤링', '획득', '데이터', '자료', '조사', '논문'],
  },
  {
    id: 4,
    title: '분석',
    description: 'SPSS 및 통계 분석 진행',
    keywords: ['분석', 'spss', '통계', '결과', '코딩', '분석 진행', '차트', '해석', '검증'],
  },
  {
    id: 5,
    title: '발표준비',
    description: '발표 및 PPT 준비',
    keywords: ['발표', 'ppt', '대본', '스크립트', '제작', '피피티', '녹음', '연습', '최종', '발표준비'],
  }
];

const getTaskStageId = (task: any) => {
  const text = `${task.title || ''} ${task.description || ''}`.toLowerCase();
  
  if (text.includes('[1단계]') || text.includes('1단계') || text.includes('[stage1]')) return 1;
  if (text.includes('[2단계]') || text.includes('2단계') || text.includes('[stage2]')) return 2;
  if (text.includes('[3단계]') || text.includes('3단계') || text.includes('[stage3]')) return 3;
  if (text.includes('[4단계]') || text.includes('4단계') || text.includes('[stage4]')) return 4;
  if (text.includes('[5단계]') || text.includes('5단계') || text.includes('[stage5]')) return 5;
  
  for (let i = DEFAULT_STAGES.length - 1; i >= 0; i--) {
    const stage = DEFAULT_STAGES[i];
    if (stage.keywords.some(k => text.includes(k))) {
      return stage.id;
    }
  }
  return 1;
};

export default function Tasks({ projectId: propProjectId }: TasksProps) {
  const { projectId: routeProjectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const projectIdStr = propProjectId ? String(propProjectId) : routeProjectId;
  const numProjectId = projectIdStr ? Number(projectIdStr) : 0;
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [projectStats, setProjectStats] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createModalConfig, setCreateModalConfig] = useState<{ stageId: number } | null>(null);
  const [submitTask, setSubmitTask] = useState<Task | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const currentMember = members.find(m => m.email === user?.email);
  const isLeader = currentMember?.role === "LEADER";

  const fetchData = useCallback(async () => {
    if (!numProjectId) return;
    try {
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
  }, [numProjectId, user]);

  useEffect(() => {
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
  }, [numProjectId, fetchData]);

  const stageGroupedTasks = useMemo(() => {
    const map: { [stageId: number]: Task[] } = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    
    tasks.forEach(task => {
      const stageId = getTaskStageId(task);
      if (map[stageId]) {
        map[stageId].push(task);
      } else {
        map[1].push(task);
      }
    });

    return DEFAULT_STAGES.map(stage => ({
      stage,
      tasks: map[stage.id] || []
    }));
  }, [tasks]);

  const updateStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (newStatus === 'DONE') {
      alert("완료 상태로는 직접 이동할 수 없습니다. 산출물을 제출하고 팀원의 승인을 받아주세요.");
      return;
    }
    if (newStatus === 'IN_REVIEW') {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setSubmitTask(task);
      }
      return;
    }

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await taskApi.updateTaskStatus(numProjectId, taskId, newStatus);
      fetchData();
    } catch {
      fetchData(); // 실패 시 원복
    }
  };

  const approveTask = async (taskId: string) => {
    try {
      await taskApi.approveTask(numProjectId, taskId);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "승인에 실패했습니다.");
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("이 과제를 삭제하시겠습니까?")) return;
    setTasks(prev => prev.filter(t => t.id !== taskId));
    try {
      await taskApi.deleteTask(numProjectId, taskId);
      fetchData();
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };


  return (
    <div className="pt-2 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-[20px] font-black text-[#1A2340] dark:text-white tracking-tight flex items-center gap-2">
            과제 단계별 관리
            <span className="text-xs font-bold text-gray-400 dark:text-white/30 px-2 py-0.5 bg-gray-50 dark:bg-white/5 rounded-full">
              총 {tasks.length}개
            </span>
          </h2>
          <p className="text-xs text-gray-400 dark:text-white/40 mt-1">프로젝트 핵심 단계별로 과제 진행 사항과 결과물을 체계적으로 관리하세요.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {numProjectId && (
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              AI 과제 생성
            </button>
          )}
          <button 
            onClick={() => setCreateModalConfig({ stageId: 1 })}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#11B886] hover:bg-[#0EA271] text-white rounded-xl text-sm font-bold transition-all border-none shadow-sm active:scale-95"
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
          {stageGroupedTasks.map(({ stage, tasks: stageTasks }) => {
            const completedCount = stageTasks.filter(t => t.status === 'DONE').length;
            const progressPercent = stageTasks.length > 0 ? Math.round((completedCount / stageTasks.length) * 100) : 0;
            
            return (
              <div 
                key={stage.id} 
                className="bg-white dark:bg-[#132038] rounded-2xl p-6 border border-gray-100 dark:border-white/5 shadow-sm space-y-5"
              >
                {/* Group Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-white/5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white bg-gradient-to-br from-[#11B886] to-[#0EA271] text-sm shadow-md flex-shrink-0">
                      {stage.id}
                    </div>
                    <div>
                      <h4 className="text-[16px] font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {stage.title}
                        <span className="text-[11px] font-medium text-gray-400 dark:text-white/30">
                          {stage.description}
                        </span>
                      </h4>
                      {/* Progress bar inside stage header */}
                      {stageTasks.length > 0 && (
                        <div className="flex items-center gap-2 mt-1.5 w-64">
                          <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-[#11B886] h-1.5 rounded-full transition-all duration-500" 
                              style={{ width: `${progressPercent}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-black text-[#11B886]">{progressPercent}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-[11px] font-bold text-[#11B886] bg-[#11B886]/10 px-2.5 py-1 rounded-full border border-[#11B886]/20">
                      진행 {completedCount}/{stageTasks.length}개
                    </span>
                    <button 
                      onClick={() => setCreateModalConfig({ stageId: stage.id })}
                      className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-[#11B886]/10 text-gray-500 hover:text-[#11B886] dark:text-white/50 dark:hover:text-[#11B886] rounded-xl text-xs font-bold transition-all"
                      title="이 단계에 과제 추가"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      과제 추가
                    </button>
                  </div>
                </div>

                {/* Stage Tasks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {stageTasks.length > 0 ? (
                    stageTasks.map(task => {
                      const cleanTitle = task.title.replace(/\[\d+단계\]/g, '').trim();
                      const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'DONE';
                      
                      let statusColor = "text-gray-500 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10";
                      let statusLabel = "할 일";
                      if (task.status === "DONE") {
                        statusColor = "text-[#11B886] bg-[#11B886]/10 border-[#11B886]/20";
                        statusLabel = "완료";
                      } else if (task.status === "IN_PROGRESS") {
                        statusColor = "text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-500/20";
                        statusLabel = "진행 중";
                      } else if (task.status === "IN_REVIEW") {
                        statusColor = "text-purple-600 bg-purple-50 dark:bg-purple-500/10 border-purple-500/20";
                        statusLabel = "검토 중";
                      }

                      return (
                        <div 
                          key={task.id} 
                          className={`bg-gray-50/50 dark:bg-[#12182B] rounded-2xl p-5 border shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[175px] group relative ${
                            isOverdue 
                              ? "border-red-200 dark:border-red-500/20" 
                              : "border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10"
                          }`}
                          onClick={() => setSelectedTask(task)}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-4 mb-2.5">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase tracking-wider ${statusColor}`}>
                                {statusLabel}
                              </span>
                              
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {isLeader && (
                                  <button 
                                    onClick={async (e) => { 
                                      e.stopPropagation(); 
                                      await deleteTask(task.id);
                                    }}
                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="과제 삭제"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            <h5 className={`text-[14px] font-bold leading-snug mb-1 truncate ${task.status === 'DONE' ? 'line-through text-gray-400 dark:text-white/20' : 'text-gray-900 dark:text-white'}`}>
                              {cleanTitle}
                            </h5>
                            <p className="text-[12px] text-gray-400 dark:text-white/40 line-clamp-2 leading-relaxed">
                              {task.description || "상세 설명이 없습니다."}
                            </p>
                          </div>

                          <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-white/5 flex flex-col gap-2.5">
                            {/* Deliverables Attachment Tag */}
                            {task.status === 'IN_REVIEW' && task.deliverables && task.deliverables.length > 0 && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 dark:bg-purple-500/10 rounded-lg border border-purple-100 dark:border-purple-500/20 w-fit">
                                <Paperclip className="w-3 h-3 text-purple-400 flex-shrink-0" />
                                <span className="text-[10px] font-bold text-purple-500">
                                  산출물 {task.deliverables.length}개 제출됨
                                </span>
                              </div>
                            )}

                            {/* Main Footer Row */}
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex flex-col gap-1 min-w-0">
                                <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-white/30 font-medium">
                                  <CalendarIcon className="w-3 h-3" />
                                  <span>마감: {task.deadline ? task.deadline.slice(5) : "없음"}</span>
                                </div>
                                <span className="text-[11px] font-bold text-gray-500 dark:text-white/50 truncate">
                                  담당: {task.assignees?.map(email => getMemberName(email, members)).join(', ') || "미지정"}
                                </span>
                              </div>

                              {/* Interactive Action Buttons */}
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {task.status === 'TODO' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); updateStatus(task.id, 'IN_PROGRESS'); }}
                                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg shadow-sm transition-all"
                                  >
                                    시작하기
                                  </button>
                                )}
                                
                                {task.status === 'IN_PROGRESS' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); updateStatus(task.id, 'IN_REVIEW'); }}
                                    className="px-2.5 py-1 bg-purple-500 hover:bg-purple-600 text-white text-[10px] font-bold rounded-lg shadow-sm transition-all"
                                  >
                                    산출물 제출
                                  </button>
                                )}

                                {task.status === 'IN_REVIEW' && (
                                  <div className="flex items-center gap-1 bg-purple-50 dark:bg-purple-500/10 rounded-lg p-1 border border-purple-100 dark:border-purple-500/20">
                                    <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 px-1">
                                      승인 {task.approvals?.length || 0}/1
                                    </span>
                                    {task.submitterEmail !== user?.email && !task.approvals?.find(a => a.userEmail === user?.email) && (
                                      <button 
                                        onClick={e => { e.stopPropagation(); approveTask(task.id); }}
                                        className="px-2 py-0.5 bg-purple-500 hover:bg-purple-600 text-white text-[9px] font-bold rounded shadow-sm transition-colors"
                                      >
                                        승인
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-10 flex flex-col items-center justify-center border border-dashed border-gray-150 dark:border-white/5 rounded-2xl bg-gray-50/20 dark:bg-transparent">
                      <p className="text-gray-400 text-xs font-bold">이 단계에 등록된 과제가 없습니다.</p>
                    </div>
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

      {createModalConfig && (
        <TaskCreateModal
          projectId={numProjectId}
          members={members}
          initialStageId={createModalConfig.stageId}
          onClose={() => setCreateModalConfig(null)}
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
            taskApi.getTasks(numProjectId).then(setTasks);
          }}
        />
      )}

      {submitTask && numProjectId && (
        <TaskSubmitModal
          projectId={numProjectId}
          task={submitTask}
          onClose={() => setSubmitTask(null)}
          onSuccess={() => {
            setSubmitTask(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
