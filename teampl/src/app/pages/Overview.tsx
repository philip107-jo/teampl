import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2, Clock, AlertCircle, BarChart3,
  Users, Calendar, FileText, TrendingUp,
  Zap, Circle, ChevronRight, Star, ArrowLeft,
  Lock, Check, Plus, Trash2, Edit2, Play, MousePointer, X, Brain, Sparkles
} from 'lucide-react';
import { taskApi } from '../api/taskApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiClient } from '../api/client';
import { socket, joinProjectChannel } from '../socket';
import { SubscriptionPaywallModal } from "../components/SubscriptionPaywallModal";
import AiTaskSplitModal from '../components/AiTaskSplitModal';
import TaskDeleteModal from '../components/TaskDeleteModal';
import { TaskStatus, Task } from '../types';

interface OverviewProps {
  projectId: number;
  project: any;
  members: any[];
  isReadOnly?: boolean;
}

interface Stage {
  id: number;
  title: string;
  description: string;
  keywords: string[];
}

import { DEFAULT_STAGES, getTaskStageId } from "../constants/stages";

const PRIORITY_COLOR: Record<string, string> = {
  high: 'text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20',
  medium: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20',
  low: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20',
};

const PRIORITY_LABEL: Record<string, string> = { high: '높음', medium: '중간', low: '낮음' };

export default function Overview({ projectId, project, members, isReadOnly }: OverviewProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'detail'>('timeline');
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  
  // Shake animation triggers for locked stages
  const [shakingStageId, setShakingStageId] = useState<number | null>(null);

  // AI Modal states
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState<string>('');
  const [taskToDelete, setTaskToDelete] = useState<any | null>(null);

  const activeStages: Stage[] = (project.customStages && project.customStages.length > 0) ? project.customStages : DEFAULT_STAGES;

  // Quick task input states (one for each column)
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newInProgressTitle, setNewInProgressTitle] = useState('');
  const [newDoneTitle, setNewDoneTitle] = useState('');

  // Drag and drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      const t = await taskApi.getTasks(projectId);
      setTasks(t);
    } catch (e) {
      console.error(e);
      showToast('태스크 목록을 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, showToast]);

  useEffect(() => {
    loadTasks();

    // Subscribe to real-time updates for perfect page synchronization
    joinProjectChannel(projectId);
    const onTaskUpdated = () => {
      loadTasks();
    };
    socket.on('taskUpdated', onTaskUpdated);

    return () => {
      socket.off('taskUpdated', onTaskUpdated);
    };
  }, [projectId, loadTasks]);

  // Component now imports getTaskStageId directly, so we just use that directly
  // Note: Since project.customStages might override DEFAULT_STAGES, we still need
  // a local getTaskStageId equivalent if custom stages are active.
  const getStageIdForTask = useCallback((task: any) => {
    if (project.customStages && project.customStages.length > 0) {
      const text = `${task.title || ''} ${task.description || ''}`.toLowerCase();
      const match = text.match(/\[(?:stage:?)?(\d+)단계?\]/i) || text.match(/\[stage(\d+)\]/i);
      if (match) return parseInt(match[1], 10);
      
      for (let i = activeStages.length - 1; i >= 0; i--) {
        const stage = activeStages[i];
        if (stage.keywords && stage.keywords.some((k: string) => text.includes(k.toLowerCase()))) {
          return stage.id;
        }
      }
      return activeStages[0].id;
    }
    return getTaskStageId(task.title, task.description);
  }, [activeStages, project.customStages]);

  // Compute tasks & progress for each stage
  const getStageStats = useCallback((stage: Stage) => {
    const stageTasks = tasks.filter(t => getStageIdForTask(t) === stage.id);
    const total = stageTasks.length;
    const done = stageTasks.filter(t => t.status === 'DONE').length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    
    return {
      tasks: stageTasks,
      total,
      done,
      progress,
      hasTasks: total > 0
    };
  }, [tasks, getStageIdForTask]);

  // Check if stage is unlocked
  const isStageUnlocked = useCallback((stageId: number) => {
    if (stageId === 1) return true; // Stage 1 is always unlocked
    
    // Stage N unlocks ONLY if ALL stages from 1 to Stage N-1 are 100% complete with tasks
    for (let i = 0; i < activeStages.length; i++) {
        const stage = activeStages[i];
        if (stage.id >= stageId) break;
        const stats = getStageStats(stage);
        if (stats.total === 0 || stats.progress < 100) {
            return false;
        }
    }
    return true;
  }, [activeStages, getStageStats]);

  const handleStageClick = (stageId: number) => {
    if (isStageUnlocked(stageId)) {
      setSelectedStageId(stageId);
      setViewMode('detail');
    } else {
      // Lock shake feedback
      setShakingStageId(stageId);
      showToast('이전 단계를 100% 완료하면 열립니다 🔒', 'info');
      setTimeout(() => setShakingStageId(null), 500);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const originalStatus = task.status;

    if (newStatus === 'DONE' && task.requiresDeliverable !== false && originalStatus !== 'IN_REVIEW') {
      showToast('이 과제는 산출물 제출 및 팀원의 승인이 필요합니다. (과제 관리 메뉴 이용)', 'error');
      return;
    }

    // Instant UI reactive state update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    
    try {
      await taskApi.updateTaskStatus(projectId, taskId, newStatus);
    } catch (e: any) {
      console.error(e);
      // Revert UI on failure
      if (e.response?.status === 402) {
        handlePaywallNeeded('더 많은 작업을 수행하려면 요금제 업그레이드가 필요합니다.');
      }
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: originalStatus } : t));
      showToast('상태 변경에 실패했습니다.', 'error');
    }
  };

  const handlePaywallNeeded = (message: string) => {
    setIsAiModalOpen(false);
    setPaywallMessage(message);
    setIsPaywallOpen(true);
  };

  const totalProgress = useMemo(() => {
    if (tasks.length === 0) return 0;
    const done = tasks.filter(t => t.status === 'DONE').length;
    return Math.round((done / tasks.length) * 100);
  }, [tasks]);

  const handleCreateTask = async (stageId: number, title: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    if (!title.trim()) return;

    try {
      // Pre-tag the description with [S단계] to ensure deterministic mapping
      const newTask = await taskApi.createTask(projectId, {
        title: title.trim(),
        description: `[${stageId}단계] 신규 과제`,
        status,
        priority: 'medium',
        deadline: project.deadline || '',
        assignees: []
      });

      setTasks(prev => [...prev, newTask]);
      
      // Clear specific input
      if (status === 'TODO') setNewTodoTitle('');
      if (status === 'IN_PROGRESS') setNewInProgressTitle('');
      if (status === 'DONE') setNewDoneTitle('');

      showToast('새 과제가 추가되었습니다!', 'success');
    } catch (e: any) {
      console.error(e);
      if (e.response?.status === 402) {
        handlePaywallNeeded('작업을 추가하려면 요금제 업그레이드가 필요합니다.');
      } else {
        showToast('과제 추가에 실패했습니다.', 'error');
      }
    }
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    const taskId = taskToDelete.id;
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setTaskToDelete(null);
    try {
      await taskApi.deleteTask(projectId, taskId);
      showToast('과제가 삭제되었습니다.', 'info');
    } catch (e) {
      console.error(e);
      showToast('과제 삭제에 실패했습니다.', 'error');
      loadTasks();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-4 border-[#11B886] border-t-transparent rounded-full" />
      </div>
    );
  }

  // Active Stage Detail View
  const selectedStage = activeStages.find(s => s.id === selectedStageId);
  const selectedStageStats = selectedStageId ? getStageStats(selectedStage!) : null;
  const stageTasks = selectedStageStats?.tasks || [];
  const stageProgress = selectedStageStats?.progress || 0;

  const todoTasks = stageTasks.filter(t => t.status === 'TODO');
  const inProgressTasks = stageTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW');
  const doneTasks = stageTasks.filter(t => t.status === 'DONE');

  return (
    <div className="py-6 max-w-5xl mx-auto">
      <AnimatePresence mode="wait">
        
        {/* ============================================================== */}
        {/* 1. TIMELINE OVERVIEW VIEW                                      */}
        {/* ============================================================== */}
        {viewMode === 'timeline' && (
          <motion.div
            key="timeline"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 px-4"
          >
            {/* Header Area: Completely seamless to match screenshot exactly */}
            <div className="flex items-center justify-between pt-4 pb-2">
              <div>
                <h2 className="text-[20px] font-bold text-[#1A2340] dark:text-white tracking-tight">프로젝트 단계</h2>
                <p className="text-sm text-slate-400 dark:text-white/40 mt-1 hidden sm:block">단계별 과제를 완료하면 다음 단계가 열립니다</p>
              </div>
              {!isReadOnly && (
                <button
                  onClick={() => setIsAiModalOpen(true)}
                  className="bg-[#131C35] hover:bg-[#131C35]/90 transition text-white px-5 py-2.5 rounded-xl text-[13px] font-bold active:scale-95 flex items-center gap-2 shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  AI 자동 기획
                </button>
              )}
            </div>

            {/* Vertical Timeline Nodes: Perfectly aligned side-by-side flex layout */}
            <div className="space-y-0 mt-6 relative">
              {activeStages.map((stage, idx) => {
                const stats = getStageStats(stage);
                const unlocked = isStageUnlocked(stage.id);
                const isCompleted = stats.hasTasks && stats.progress === 100;
                const isActive = unlocked && !isCompleted;
                const isShaking = shakingStageId === stage.id;

                return (
                  <motion.div
                    key={stage.id}
                    className="relative flex items-stretch gap-6"
                    initial={{ opacity: 0, x: -20 }}
                    animate={isShaking ? { x: [-6, 6, -6, 6, -4, 4, 0] } : { x: 0, opacity: 1 }}
                    transition={isShaking ? { duration: 0.4 } : { delay: idx * 0.05 }}
                  >
                    {/* Left node status line & circle column */}
                    <div className="flex flex-col items-center shrink-0 w-12 relative">
                      {/* Segment connector line */}
                      {idx !== activeStages.length - 1 && (
                        <div className="absolute top-8 bottom-[-45px] w-[1.5px] bg-slate-200 dark:bg-white/10" />
                      )}

                      {/* Circle button */}
                      <button
                        onClick={() => handleStageClick(stage.id)}
                        className={`w-9 h-9 rounded-full border flex items-center justify-center font-semibold text-sm transition-all z-10 shadow-sm ${
                          isCompleted
                            ? 'bg-[#00B884] border-[#00B884] text-white shadow-[#00B884]/20 shadow-md'
                            : isActive
                            ? 'bg-white dark:bg-[#12182B] border-slate-200 dark:border-white/10 text-slate-400'
                            : unlocked
                            ? 'bg-white dark:bg-[#12182B] border-slate-200 dark:border-white/10 text-slate-400'
                            : 'bg-[#F8FAFC] dark:bg-[#12182B] border-slate-200/80 dark:border-white/5 text-slate-300'
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        ) : !unlocked ? (
                          <Lock className="w-3.5 h-3.5 text-slate-300 dark:text-white/20" />
                        ) : (
                          stage.id
                        )}
                      </button>
                    </div>

                    {/* Right Card Column */}
                    <div className="flex-1 pb-10">
                      <div
                        onClick={() => handleStageClick(stage.id)}
                        className={`bg-white dark:bg-[#12182B] rounded-2xl p-5 border transition-all cursor-pointer select-none shadow-[0_1px_3px_rgba(0,0,0,0.015)] group ${
                          isActive
                            ? 'border-emerald-500 hover:shadow-md'
                            : unlocked
                            ? 'border-slate-100 dark:border-white/5 hover:border-slate-200 hover:shadow-md'
                            : 'border-slate-100 dark:border-white/5 opacity-70 bg-white dark:bg-[#12182B]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className={`text-base font-bold transition-colors ${
                                isActive ? 'text-[#1A2340] dark:text-white group-hover:text-emerald-500' :
                                unlocked ? 'text-[#1A2340] dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-300' :
                                'text-slate-400 dark:text-white/30'
                              }`}>
                                {stage.title}
                              </h3>
                              {!unlocked && (
                                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md ml-1">잠김</span>
                              )}
                              {isCompleted && (
                                <span className="text-[11px] font-bold text-white bg-[#00B884] px-2 py-0.5 rounded-md ml-1">완료</span>
                              )}
                            </div>
                            <p className={`text-sm ${!unlocked ? 'text-slate-300 dark:text-white/20' : 'text-slate-400 dark:text-white/40'}`}>
                              {stage.description}
                            </p>
                            {!unlocked && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-white/30 mt-1 font-semibold">
                                <span>ⓘ 이전 단계를 100% 완료하면 열립니다</span>
                              </div>
                            )}
                          </div>

                          {/* Right: progress and actions aligned identical to design */}
                          <div className="flex items-center gap-6 text-right">
                            <div className="flex items-center gap-2">
                              {!isReadOnly && isActive && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleStageClick(stage.id); }}
                                  className="bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 transition text-gray-700 dark:text-white px-3 py-1.5 rounded-lg text-xs font-bold shrink-0"
                                >
                                  과제 시작하기
                                </button>
                              )}
                            </div>
                            <span className="text-sm font-semibold text-slate-400 dark:text-white/30 w-20">
                              {stats.hasTasks ? (
                                isCompleted ? '완료' : `${stats.progress}% 진행 중`
                              ) : (
                                '과제 없음'
                              )}
                            </span>
                            <span className="text-slate-300 dark:text-white/10 text-sm font-semibold pr-2">-</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ============================================================== */}
        {/* 2. STAGE DETAIL KANBAN VIEW                                    */}
        {/* ============================================================== */}
        {viewMode === 'detail' && selectedStage && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="space-y-6"
          >
            {/* Header matched to design screenshot */}
            <div className="flex items-center justify-between bg-white dark:bg-[#12182B] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setViewMode('timeline')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 text-[#1A2340] dark:text-white" />
                </button>
                <div>
                  <h2 className="text-xl md:text-[22px] font-black text-[#1A2340] dark:text-white tracking-tight flex items-center gap-2">
                    {selectedStage.id}단계 · {selectedStage.title}
                  </h2>
                  <p className="text-[13px] text-gray-500 font-semibold mt-0.5">{project.name}</p>
                </div>
              </div>

              {/* Sizing & Suffix information */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-2xl font-black text-[#11B886]">{stageProgress}%</span>
                  <p className="text-[11px] font-bold text-gray-400 dark:text-white/30">
                    {doneTasks.length}/{stageTasks.length} 완료
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden flex items-center justify-center border border-gray-200 dark:border-white/10 shadow-inner">
                  <span className="text-xs font-bold text-gray-600 dark:text-white/60">{user?.name?.[0]}</span>
                </div>
              </div>
            </div>

            {/* Kanban columns Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              
              {/* COLUMN 1: 할 일 */}
              <div
                className="bg-[#F8FAFC] dark:bg-[#0F172A]/40 rounded-2xl p-5 border border-slate-100 dark:border-white/5 flex flex-col min-h-[500px]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                    <h3 className="font-black text-[#1A2340] dark:text-white text-base">할 일</h3>
                  </div>
                  <span className="bg-gray-200/60 dark:bg-white/10 text-gray-600 dark:text-white/60 font-bold px-2 py-0.5 rounded-lg text-xs">
                    {todoTasks.length}
                  </span>
                </div>

                {/* List Container */}
                <div className="flex-1 space-y-3.5 mb-4">
                  {todoTasks.length > 0 ? (
                    todoTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isReadOnly={true}
                        onDelete={() => setTaskToDelete(task)}
                        onStatusChange={(status) => handleUpdateTaskStatus(task.id, status)}
                      />
                    ))
                  ) : (
                    <EmptyPlaceholder />
                  )}
                </div>

                {/* Quick Add Form */}
                {!isReadOnly && (
                  <div className="relative mt-auto">
                    <input
                      type="text"
                      value={newTodoTitle}
                      onChange={(e) => setNewTodoTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateTask(selectedStage.id, newTodoTitle, 'TODO')}
                      placeholder="+ 새 과제 추가..."
                      className="w-full bg-white dark:bg-[#12182B] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-[#1A2340] dark:text-white outline-none focus:border-[#11B886] transition-all font-semibold placeholder-gray-400 shadow-sm"
                    />
                  </div>
                )}
              </div>

              {/* COLUMN 2: 진행 중 */}
              <div
                className="bg-[#FFFDF5] dark:bg-[#0F172A]/40 rounded-2xl p-5 border border-amber-100/40 dark:border-white/5 flex flex-col min-h-[500px]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <h3 className="font-black text-[#1A2340] dark:text-white text-base">진행 중</h3>
                  </div>
                  <span className="bg-amber-100/60 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 font-bold px-2 py-0.5 rounded-lg text-xs">
                    {inProgressTasks.length}
                  </span>
                </div>

                {/* List Container */}
                <div className="flex-1 space-y-3.5 mb-4">
                  {inProgressTasks.length > 0 ? (
                    inProgressTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isReadOnly={true}
                        onDelete={() => setTaskToDelete(task)}
                        onStatusChange={(status) => handleUpdateTaskStatus(task.id, status)}
                      />
                    ))
                  ) : (
                    <EmptyPlaceholder />
                  )}
                </div>

                {/* Quick Add Form */}
                {!isReadOnly && (
                  <div className="relative mt-auto">
                    <input
                      type="text"
                      value={newInProgressTitle}
                      onChange={(e) => setNewInProgressTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateTask(selectedStage.id, newInProgressTitle, 'IN_PROGRESS')}
                      placeholder="+ 새 과제 추가..."
                      className="w-full bg-white dark:bg-[#12182B] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-[#1A2340] dark:text-white outline-none focus:border-amber-400 transition-all font-semibold placeholder-gray-400 shadow-sm"
                    />
                  </div>
                )}
              </div>

              {/* COLUMN 3: 완료 */}
              <div
                className="bg-[#F4FDF9] dark:bg-[#0F172A]/40 rounded-2xl p-5 border border-emerald-100/40 dark:border-white/5 flex flex-col min-h-[500px]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <h3 className="font-black text-[#1A2340] dark:text-white text-base">완료</h3>
                  </div>
                  <span className="bg-emerald-100/60 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 font-bold px-2 py-0.5 rounded-lg text-xs">
                    {doneTasks.length}
                  </span>
                </div>

                {/* List Container */}
                <div className="flex-1 space-y-3.5 mb-4">
                  {doneTasks.length > 0 ? (
                    doneTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isReadOnly={true}
                        onDelete={() => setTaskToDelete(task)}
                        onStatusChange={(status) => handleUpdateTaskStatus(task.id, status)}
                      />
                    ))
                  ) : (
                    <EmptyPlaceholder />
                  )}
                </div>

                {/* Quick Add Form */}
                {!isReadOnly && (
                  <div className="relative mt-auto">
                    <input
                      type="text"
                      value={newDoneTitle}
                      onChange={(e) => setNewDoneTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateTask(selectedStage.id, newDoneTitle, 'DONE')}
                      placeholder="+ 새 과제 추가..."
                      className="w-full bg-white dark:bg-[#12182B] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-[#1A2340] dark:text-white outline-none focus:border-[#11B886] transition-all font-semibold placeholder-gray-400 shadow-sm"
                    />
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================== */}
      {/* AI RECOMMENDATION INPUT MODAL                                  */}
      {/* ============================================================== */}
      <AiTaskSplitModal
        projectId={projectId}
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSuccess={() => {
          setIsAiModalOpen(false);
          showToast('✨ AI가 맞춤형 단계를 구성하고 과제를 일괄 생성했습니다!', 'success');
          loadTasks();
        }}
        onPaywallNeeded={handlePaywallNeeded}
      />
      {/* ============================================================== */}
      {/* SUBSCRIPTION PAYWALL MODAL                                     */}
      {/* ============================================================== */}
      <SubscriptionPaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        message={paywallMessage}
        onSuccess={() => {
          setIsPaywallOpen(false);
          // 닫기만 하고 사용자가 다시 버튼을 누를 수 있도록 둠
        }}
      />

      {/* -- Delete Confirmation Modal -- */}
      {/* -- Delete Confirmation Modal -- */}
      <TaskDeleteModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={confirmDeleteTask}
        taskTitle={taskToDelete?.title}
      />
    </div>
  );
}

// ==============================================================
// 3. TASK CARD SUBCOMPONENT                                     
// ==============================================================
interface TaskCardProps {
  task: any;
  onDragStart?: () => void;
  onDelete: () => void;
  onStatusChange: (status: 'TODO' | 'IN_PROGRESS' | 'DONE') => void;
  isReadOnly?: boolean;
}

function TaskCard({ task, onDragStart, onDelete, onStatusChange, isReadOnly }: TaskCardProps) {
  // Strip stage tag from showing in title for ultra-clean look
  const cleanTitle = task.title.replace(/\[\d+단계\]/g, '').trim();

  return (
    <div
      draggable={!isReadOnly}
      onDragStart={!isReadOnly ? onDragStart : undefined}
      className={`bg-white dark:bg-[#12182B] border border-gray-200/60 dark:border-white/5 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all select-none group relative ${!isReadOnly ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {/* Delete button (shows on hover) */}
      {!isReadOnly && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 rounded-lg"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Tags & Meta */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.medium}`}>
          {PRIORITY_LABEL[task.priority] || '보통'}
        </span>
        {task.difficulty && (
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">
            난이도 {task.difficulty}
          </span>
        )}
      </div>

      {/* Task title */}
      <h4 className="text-[13px] font-black text-gray-800 dark:text-white leading-snug pr-6 mb-1.5">
        {cleanTitle}
      </h4>

      {/* Optional Description */}
      {task.description && !task.description.startsWith('[') && (
        <p className="text-xs text-gray-400 dark:text-white/40 line-clamp-2 leading-relaxed mb-3">
          {task.description}
        </p>
      )}

      {/* Bottom controls / Status quick click indicators */}
      <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-3 mt-3">
        {!isReadOnly ? (
          <div className="flex items-center gap-1">
            {task.status !== 'TODO' && (
              <button
                onClick={() => onStatusChange('TODO')}
                className="text-[10px] font-bold text-gray-400 hover:text-gray-600 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 px-2 py-1 rounded"
              >
                대기
              </button>
            )}
            {task.status !== 'IN_PROGRESS' && (
              <button
                onClick={() => onStatusChange('IN_PROGRESS')}
                className="text-[10px] font-bold text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 px-2 py-1 rounded"
              >
                진행
              </button>
            )}
            {task.status !== 'DONE' && (
              <button
                onClick={() => onStatusChange('DONE')}
                className="text-[10px] font-bold text-emerald-500 hover:text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 px-2 py-1 rounded"
              >
                완료
              </button>
            )}
          </div>
        ) : <div />}

        {/* Date or calendar indicator */}
        {task.deadline && (
          <span className="text-[10px] font-bold text-gray-400 dark:text-white/30 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {task.deadline}
          </span>
        )}
      </div>
    </div>
  );
}

// ==============================================================
// 4. EMPTY COLUMN PLACEHOLDER SUBCOMPONENT                       
// ==============================================================
function EmptyPlaceholder() {
  return (
    <div className="border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-slate-400 dark:text-white/20 bg-white/30 dark:bg-[#12182B]/20 py-12">
      <MousePointer className="w-6 h-6 mb-2.5 stroke-[1.5]" />
      <span className="text-[13px] font-black tracking-tight">과제를 이동하세요</span>
    </div>
  );
}
