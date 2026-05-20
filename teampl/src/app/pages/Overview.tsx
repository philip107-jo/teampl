import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2, Clock, AlertCircle, BarChart3,
  Users, Calendar, FileText, TrendingUp,
  Zap, Circle, ChevronRight, Star
} from 'lucide-react';
import { taskApi } from '../api/taskApi';
import { scheduleApi } from '../api/scheduleApi';
import { voteApi, Vote } from '../api/voteApi';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

interface OverviewProps {
  projectId: number;
  project: any;
  members: any[];
}

const PRIORITY_COLOR: Record<string, string> = {
  high: 'text-red-500 bg-red-50 dark:bg-red-500/10',
  medium: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10',
  low: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10',
};
const PRIORITY_LABEL: Record<string, string> = { high: '높음', medium: '중간', low: '낮음' };

const STATUS_COLOR: Record<string, string> = {
  TODO: 'text-gray-400 dark:text-white/30',
  IN_PROGRESS: 'text-amber-500',
  DONE: 'text-[#11B886]',
};
const STATUS_LABEL: Record<string, string> = { TODO: '대기', IN_PROGRESS: '진행중', DONE: '완료' };

export default function Overview({ projectId, project, members }: OverviewProps) {
  const { user } = useAuth();
  const { onlineUsers } = useChat();

  const [tasks, setTasks] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [t, s, v] = await Promise.all([
        taskApi.getTasks(projectId),
        scheduleApi.getSchedules(projectId),
        voteApi.getVotes(projectId),
      ]);
      setTasks(t);
      setSchedules(s);
      setVotes(v);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  // 통계 계산
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'DONE').length;
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS').length;
  const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const myTasks = tasks.filter(t =>
    t.assignees?.includes(user?.email) && t.status !== 'DONE'
  ).slice(0, 5);

  // 오늘~7일 이내 일정
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingSchedules = schedules
    .filter(s => {
      const d = new Date(s.date);
      return d >= now && d <= in7Days;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  // 아직 투표 안 한 진행중 투표
  const pendingVotes = votes.filter(v => !v.isExpired && v.myOptionIds.length === 0);

  // 최근 완료한 업무
  const recentDone = tasks
    .filter(t => t.status === 'DONE' && t.completedAt)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-4 border-[#11B886] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="py-6 space-y-8 max-w-5xl mx-auto">
      {/* ── 상단 Stats 카드들 ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: '전체 할 일',
            value: totalTasks,
            icon: FileText,
            color: 'blue',
            bg: 'bg-blue-50 dark:bg-blue-500/10',
            icon_color: 'text-blue-500',
          },
          {
            label: '진행 중',
            value: inProgressTasks,
            icon: Zap,
            color: 'amber',
            bg: 'bg-amber-50 dark:bg-amber-500/10',
            icon_color: 'text-amber-500',
          },
          {
            label: '완료됨',
            value: doneTasks,
            icon: CheckCircle2,
            color: 'green',
            bg: 'bg-[#11B886]/10',
            icon_color: 'text-[#11B886]',
          },
          {
            label: '팀원 수',
            value: members.length,
            icon: Users,
            color: 'purple',
            bg: 'bg-purple-50 dark:bg-purple-500/10',
            icon_color: 'text-purple-500',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white dark:bg-[#12182B] rounded-[20px] p-5 border border-gray-100 dark:border-white/5 shadow-sm"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.icon_color}`} />
            </div>
            <p className="text-[28px] font-black text-[#1A2340] dark:text-white leading-none mb-1">{stat.value}</p>
            <p className="text-[11px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── 진행률 게이지 ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-[#12182B] rounded-[24px] p-6 border border-gray-100 dark:border-white/5 shadow-sm"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#11B886]/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#11B886]" />
            </div>
            <div>
              <h3 className="text-[15px] font-black text-[#1A2340] dark:text-white">전체 진행률</h3>
              <p className="text-[11px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">{doneTasks} / {totalTasks} 완료</p>
            </div>
          </div>
          <span className="text-[36px] font-black text-[#11B886] leading-none">{progressPct}%</span>
        </div>

        {/* 게이지 바 */}
        <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#11B886] to-[#27D7A1]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.4 }}
          />
        </div>

        {/* 세그먼트 설명 */}
        <div className="flex items-center gap-6 mt-4">
          {[
            { label: '대기', pct: totalTasks > 0 ? Math.round((tasks.filter(t => t.status === 'TODO').length / totalTasks) * 100) : 0, color: 'bg-gray-200 dark:bg-white/10' },
            { label: '진행중', pct: totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0, color: 'bg-amber-400' },
            { label: '완료', pct: progressPct, color: 'bg-[#11B886]' },
          ].map(seg => (
            <div key={seg.label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${seg.color}`} />
              <span className="text-[11px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">{seg.label} {seg.pct}%</span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── 내 할 일 ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white dark:bg-[#12182B] rounded-[24px] p-6 border border-gray-100 dark:border-white/5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="text-[15px] font-black text-[#1A2340] dark:text-white">내 할 일</h3>
              <p className="text-[11px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">담당 미완료 업무</p>
            </div>
          </div>

          {myTasks.length > 0 ? (
            <div className="space-y-2.5">
              {myTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                  {task.status === 'IN_PROGRESS'
                    ? <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    : <Circle className="w-4 h-4 text-gray-300 dark:text-white/20 flex-shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-[#1A2340] dark:text-white truncate">{task.title}</p>
                    <p className="text-[11px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">{STATUS_LABEL[task.status]} · 마감 {task.deadline}</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${PRIORITY_COLOR[task.priority]}`}>
                    {PRIORITY_LABEL[task.priority]}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-[#11B886]/30 mb-2" />
              <p className="text-[13px] font-bold text-gray-400 dark:text-white/30">담당 업무가 없습니다 🎉</p>
            </div>
          )}
        </motion.div>

        {/* ── 다가오는 일정 ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-[#12182B] rounded-[24px] p-6 border border-gray-100 dark:border-white/5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-[15px] font-black text-[#1A2340] dark:text-white">이번 주 일정</h3>
              <p className="text-[11px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">7일 이내 예정</p>
            </div>
          </div>

          {upcomingSchedules.length > 0 ? (
            <div className="space-y-2.5">
              {upcomingSchedules.map(schedule => {
                const d = new Date(schedule.date);
                const isToday = d.toDateString() === now.toDateString();
                const isTomorrow = d.toDateString() === new Date(now.getTime() + 86400000).toDateString();
                const label = isToday ? '오늘' : isTomorrow ? '내일' : `${d.getMonth() + 1}/${d.getDate()}`;
                return (
                  <div key={schedule.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${isToday ? 'bg-[#11B886]/10' : 'bg-gray-50 dark:bg-white/5'}`}>
                      <span className={`text-[12px] font-black leading-none ${isToday ? 'text-[#11B886]' : 'text-gray-400 dark:text-white/30'}`}>{label}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-[#1A2340] dark:text-white truncate">{schedule.title}</p>
                      <p className="text-[11px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">
                        {d.getHours().toString().padStart(2, '0')}:{d.getMinutes().toString().padStart(2, '0')}
                      </p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${schedule.dot || 'bg-[#11B886]'}`} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="w-10 h-10 text-gray-200 dark:text-white/10 mb-2" />
              <p className="text-[13px] font-bold text-gray-400 dark:text-white/30">이번 주 예정된 일정이 없습니다</p>
            </div>
          )}
        </motion.div>

        {/* ── 투표 현황 ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white dark:bg-[#12182B] rounded-[24px] p-6 border border-gray-100 dark:border-white/5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-[#11B886]/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#11B886]" />
            </div>
            <div>
              <h3 className="text-[15px] font-black text-[#1A2340] dark:text-white">투표 현황</h3>
              <p className="text-[11px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">미참여 투표</p>
            </div>
          </div>

          {pendingVotes.length > 0 ? (
            <div className="space-y-2.5">
              {pendingVotes.slice(0, 3).map(vote => (
                <div key={vote.id} className="flex items-center gap-3 p-3 rounded-2xl bg-[#11B886]/5 border border-[#11B886]/10">
                  <AlertCircle className="w-4 h-4 text-[#11B886] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-[#1A2340] dark:text-white truncate">{vote.title}</p>
                    <p className="text-[11px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">
                      {vote.totalVotes}표 · {vote.isMultiple ? '복수선택' : '단일선택'}
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-[#11B886] uppercase tracking-widest animate-pulse">미참여</span>
                </div>
              ))}
              {pendingVotes.length > 3 && (
                <p className="text-[11px] text-center font-black text-gray-400 dark:text-white/30 pt-1">+{pendingVotes.length - 3}개 더 있음</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-[#11B886]/30 mb-2" />
              <p className="text-[13px] font-bold text-gray-400 dark:text-white/30">모든 투표에 참여했습니다 👍</p>
            </div>
          )}
        </motion.div>

        {/* ── 팀원 상태 ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-[#12182B] rounded-[24px] p-6 border border-gray-100 dark:border-white/5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-[15px] font-black text-[#1A2340] dark:text-white">팀원 현황</h3>
              <p className="text-[11px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">
                {onlineUsers.filter(e => members.some((m: any) => m.email === e)).length}명 온라인
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {members.map((member: any) => {
              const isOnline = onlineUsers.includes(member.email);
              const memberTasks = tasks.filter(t => t.assignees?.includes(member.email));
              const memberDone = memberTasks.filter(t => t.status === 'DONE').length;
              const memberPct = memberTasks.length > 0 ? Math.round((memberDone / memberTasks.length) * 100) : 0;

              return (
                <div key={member.email} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#11B886]/80 to-[#0D9068] flex items-center justify-center text-white text-[14px] font-black">
                      {member.name?.[0] || '?'}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-[#12182B] ${isOnline ? 'bg-[#11B886]' : 'bg-gray-300 dark:bg-white/20'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[13px] font-bold text-[#1A2340] dark:text-white truncate">
                        {member.name}
                        {member.role === 'LEADER' && <span className="ml-1.5 text-[9px] font-black text-amber-500 uppercase tracking-widest">팀장</span>}
                      </p>
                      <span className="text-[11px] font-black text-gray-400 dark:text-white/30">{memberPct}%</span>
                    </div>
                    <div className="h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#11B886] transition-all duration-700"
                        style={{ width: `${memberPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ── 최근 완료 업무 ── */}
      {recentDone.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-white dark:bg-[#12182B] rounded-[24px] p-6 border border-gray-100 dark:border-white/5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-[#11B886]/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-[#11B886]" />
            </div>
            <h3 className="text-[15px] font-black text-[#1A2340] dark:text-white">최근 완료된 업무</h3>
          </div>
          <div className="space-y-2.5">
            {recentDone.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-3 rounded-2xl">
                <CheckCircle2 className="w-4 h-4 text-[#11B886] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-[#1A2340] dark:text-white truncate line-through opacity-60">{task.title}</p>
                </div>
                <span className="text-[11px] font-black text-gray-400 dark:text-white/30 flex-shrink-0">
                  {new Date(task.completedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
