import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Trash2, X, CheckCircle2, Circle, Clock,
  BarChart3, Users, Lock, Shuffle, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { voteApi, Vote, CreateVoteData } from '../api/voteApi';
import { useAuth } from '../context/AuthContext';

interface VoteProps {
  projectId: number;
}

export default function VotePage({ projectId }: VoteProps) {
  const { user } = useAuth();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedVote, setExpandedVote] = useState<number | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number[]>>({});

  // 투표 생성 폼 state
  const [form, setForm] = useState<CreateVoteData>({
    title: '',
    description: '',
    isAnonymous: false,
    isMultiple: false,
    deadline: '',
    options: ['', ''],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadVotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await voteApi.getVotes(projectId);
      setVotes(data);
      // 기존 투표한 항목 세팅
      const init: Record<number, number[]> = {};
      data.forEach(v => {
        if (v.myOptionIds.length > 0) init[v.id] = [...v.myOptionIds];
      });
      setSelectedOptions(init);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadVotes();
  }, [loadVotes]);

  const handleOptionSelect = (vote: Vote, optionId: number) => {
    if (vote.isExpired) return;
    setSelectedOptions(prev => {
      const current = prev[vote.id] || [];
      if (vote.isMultiple) {
        if (current.includes(optionId)) {
          return { ...prev, [vote.id]: current.filter(id => id !== optionId) };
        } else {
          return { ...prev, [vote.id]: [...current, optionId] };
        }
      } else {
        if (current.includes(optionId)) {
          return { ...prev, [vote.id]: [] };
        }
        return { ...prev, [vote.id]: [optionId] };
      }
    });
  };

  const handleCastVote = async (vote: Vote) => {
    const chosen = selectedOptions[vote.id] || [];
    if (chosen.length === 0) return;
    try {
      await voteApi.castVote(projectId, vote.id, chosen);
      await loadVotes();
    } catch (e: any) {
      alert(e.response?.data?.message || '투표 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteVote = async (voteId: number) => {
    if (!confirm('이 투표를 삭제하시겠습니까?')) return;
    try {
      await voteApi.deleteVote(projectId, voteId);
      await loadVotes();
    } catch (e: any) {
      alert(e.response?.data?.message || '삭제 중 오류가 발생했습니다.');
    }
  };

  const handleCreateVote = async () => {
    if (!form.title.trim()) return alert('투표 제목을 입력하세요.');
    const validOptions = form.options.filter(o => o.trim());
    if (validOptions.length < 2) return alert('선택지를 최소 2개 이상 입력하세요.');
    try {
      setIsSubmitting(true);
      await voteApi.createVote(projectId, { ...form, options: validOptions });
      setIsCreateOpen(false);
      setForm({ title: '', description: '', isAnonymous: false, isMultiple: false, deadline: '', options: ['', ''] });
      await loadVotes();
    } catch (e: any) {
      alert(e.response?.data?.message || '생성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeVotes = votes.filter(v => !v.isExpired);
  const closedVotes = votes.filter(v => v.isExpired);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-4 border-[#11B886] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="py-6 space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-black text-[#1A2340] dark:text-white tracking-tight">팀 투표</h2>
          <p className="text-[13px] text-gray-500 dark:text-white/40 font-medium mt-0.5">팀원들과 안건을 결정하세요</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-[#11B886] text-white rounded-2xl text-[13px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shadow-[0_4px_20px_rgba(17,184,134,0.35)]"
        >
          <Plus className="w-4 h-4" />
          투표 만들기
        </button>
      </div>

      {/* Active Votes */}
      {activeVotes.length > 0 && (
        <div className="space-y-4">
          <p className="text-[11px] font-black text-[#11B886] uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-[#11B886] rounded-full animate-pulse" />
            진행중 · {activeVotes.length}
          </p>
          {activeVotes.map(vote => (
            <VoteCard
              key={vote.id}
              vote={vote}
              userEmail={user?.email || ''}
              selected={selectedOptions[vote.id] || []}
              isExpanded={expandedVote === vote.id}
              onToggleExpand={() => setExpandedVote(expandedVote === vote.id ? null : vote.id)}
              onOptionSelect={handleOptionSelect}
              onCastVote={handleCastVote}
              onDelete={handleDeleteVote}
            />
          ))}
        </div>
      )}

      {/* Closed Votes */}
      {closedVotes.length > 0 && (
        <div className="space-y-4">
          <p className="text-[11px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            종료된 투표 · {closedVotes.length}
          </p>
          {closedVotes.map(vote => (
            <VoteCard
              key={vote.id}
              vote={vote}
              userEmail={user?.email || ''}
              selected={selectedOptions[vote.id] || []}
              isExpanded={expandedVote === vote.id}
              onToggleExpand={() => setExpandedVote(expandedVote === vote.id ? null : vote.id)}
              onOptionSelect={handleOptionSelect}
              onCastVote={handleCastVote}
              onDelete={handleDeleteVote}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {votes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-3xl bg-[#11B886]/10 flex items-center justify-center mb-6">
            <BarChart3 className="w-10 h-10 text-[#11B886]/60" />
          </div>
          <p className="text-[17px] font-black text-[#1A2340] dark:text-white mb-2">투표가 없습니다</p>
          <p className="text-[13px] text-gray-400 dark:text-white/30 font-medium">팀 안건을 투표로 빠르게 결정해보세요!</p>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
            onClick={() => setIsCreateOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-white dark:bg-[#132038] rounded-[32px] p-8 shadow-2xl border border-gray-200 dark:border-white/10 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[20px] font-black text-[#1A2340] dark:text-white">새 투표 만들기</h3>
                <button onClick={() => setIsCreateOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                {/* 제목 */}
                <div>
                  <label className="text-[11px] font-black text-[#7D879C] dark:text-white/40 uppercase tracking-widest mb-2 block">투표 제목 *</label>
                  <input
                    autoFocus
                    type="text"
                    placeholder="예: 팀 미팅 요일 선정"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-[#1A2340] border border-gray-200 dark:border-white/10 rounded-2xl text-[15px] font-bold text-[#1A2340] dark:text-white focus:outline-none focus:border-[#11B886] transition-all"
                  />
                </div>

                {/* 설명 */}
                <div>
                  <label className="text-[11px] font-black text-[#7D879C] dark:text-white/40 uppercase tracking-widest mb-2 block">설명 (선택)</label>
                  <textarea
                    placeholder="투표에 대한 설명을 적어주세요"
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-[#1A2340] border border-gray-200 dark:border-white/10 rounded-2xl text-[14px] font-medium text-[#1A2340] dark:text-white focus:outline-none focus:border-[#11B886] transition-all resize-none"
                  />
                </div>

                {/* 선택지 */}
                <div>
                  <label className="text-[11px] font-black text-[#7D879C] dark:text-white/40 uppercase tracking-widest mb-2 block">선택지 *</label>
                  <div className="space-y-2">
                    {form.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#11B886]/10 text-[#11B886] text-[12px] font-black flex items-center justify-center flex-shrink-0">{i + 1}</div>
                        <input
                          type="text"
                          placeholder={`선택지 ${i + 1}`}
                          value={opt}
                          onChange={e => {
                            const next = [...form.options];
                            next[i] = e.target.value;
                            setForm({ ...form, options: next });
                          }}
                          className="flex-1 px-4 py-3 bg-gray-50 dark:bg-[#1A2340] border border-gray-200 dark:border-white/10 rounded-xl text-[14px] font-medium text-[#1A2340] dark:text-white focus:outline-none focus:border-[#11B886] transition-all"
                        />
                        {form.options.length > 2 && (
                          <button onClick={() => setForm({ ...form, options: form.options.filter((_, j) => j !== i) })} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {form.options.length < 8 && (
                      <button
                        onClick={() => setForm({ ...form, options: [...form.options, ''] })}
                        className="w-full py-2.5 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl text-[12px] font-black text-gray-400 dark:text-white/30 hover:border-[#11B886] hover:text-[#11B886] transition-all"
                      >
                        + 선택지 추가
                      </button>
                    )}
                  </div>
                </div>

                {/* 옵션 */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setForm({ ...form, isMultiple: !form.isMultiple })}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${form.isMultiple ? 'border-[#11B886] bg-[#11B886]/10' : 'border-gray-200 dark:border-white/10'}`}
                  >
                    <Shuffle className={`w-4 h-4 ${form.isMultiple ? 'text-[#11B886]' : 'text-gray-400'}`} />
                    <span className={`text-[12px] font-black uppercase tracking-widest ${form.isMultiple ? 'text-[#11B886]' : 'text-gray-400 dark:text-white/30'}`}>복수선택</span>
                  </button>
                  <button
                    onClick={() => setForm({ ...form, isAnonymous: !form.isAnonymous })}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${form.isAnonymous ? 'border-[#11B886] bg-[#11B886]/10' : 'border-gray-200 dark:border-white/10'}`}
                  >
                    <Lock className={`w-4 h-4 ${form.isAnonymous ? 'text-[#11B886]' : 'text-gray-400'}`} />
                    <span className={`text-[12px] font-black uppercase tracking-widest ${form.isAnonymous ? 'text-[#11B886]' : 'text-gray-400 dark:text-white/30'}`}>익명 투표</span>
                  </button>
                </div>

                {/* 마감일 */}
                <div>
                  <label className="text-[11px] font-black text-[#7D879C] dark:text-white/40 uppercase tracking-widest mb-2 block">마감일 (선택)</label>
                  <input
                    type="datetime-local"
                    value={form.deadline}
                    onChange={e => setForm({ ...form, deadline: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 dark:bg-[#1A2340] border border-gray-200 dark:border-white/10 rounded-2xl text-[14px] font-medium text-[#1A2340] dark:text-white focus:outline-none focus:border-[#11B886] transition-all"
                  />
                </div>

                {/* 생성 버튼 */}
                <button
                  onClick={handleCreateVote}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#11B886] text-white rounded-2xl font-black uppercase tracking-widest shadow-[0_8px_20px_rgba(17,184,134,0.3)] hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {isSubmitting ? '생성 중...' : '투표 생성하기'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface VoteCardProps {
  vote: Vote;
  userEmail: string;
  selected: number[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onOptionSelect: (vote: Vote, optionId: number) => void;
  onCastVote: (vote: Vote) => void;
  onDelete: (voteId: number) => void;
}

function VoteCard({ vote, userEmail, selected, isExpanded, onToggleExpand, onOptionSelect, onCastVote, onDelete }: VoteCardProps) {
  const hasVoted = vote.myOptionIds.length > 0;
  const isCreator = vote.creatorEmail === userEmail;
  const hasChanged = JSON.stringify([...selected].sort()) !== JSON.stringify([...vote.myOptionIds].sort());

  const deadlineStr = vote.deadline
    ? new Date(vote.deadline).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <motion.div
      layout
      className={`bg-white dark:bg-[#12182B] rounded-[24px] border overflow-hidden transition-all ${
        vote.isExpired ? 'border-gray-200 dark:border-white/5 opacity-70' : 'border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Card Header */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {vote.isExpired ? (
                <span className="px-2.5 py-1 bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30 text-[10px] font-black uppercase tracking-widest rounded-lg">종료</span>
              ) : (
                <span className="px-2.5 py-1 bg-[#11B886]/10 text-[#11B886] text-[10px] font-black uppercase tracking-widest rounded-lg animate-pulse">진행중</span>
              )}
              {vote.isAnonymous && (
                <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-500/10 text-purple-500 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1">
                  <Lock className="w-3 h-3" />익명
                </span>
              )}
              {vote.isMultiple && (
                <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1">
                  <Shuffle className="w-3 h-3" />복수선택
                </span>
              )}
            </div>
            <h3 className="text-[17px] font-black text-[#1A2340] dark:text-white tracking-tight leading-snug">{vote.title}</h3>
            {vote.description && (
              <p className="text-[13px] text-gray-500 dark:text-white/40 font-medium mt-1">{vote.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isCreator && (
              <button
                onClick={() => onDelete(vote.id)}
                className="p-2 text-gray-300 dark:text-white/20 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onToggleExpand}
              className="p-2 text-gray-400 dark:text-white/30 hover:text-[#11B886] transition-colors"
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-[12px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {vote.totalVotes}표
          </span>
          {deadlineStr && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {deadlineStr}
            </span>
          )}
          {hasVoted && !hasChanged && (
            <span className="flex items-center gap-1.5 text-[#11B886]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              투표 완료
            </span>
          )}
        </div>
      </div>

      {/* Options (expanded) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-100 dark:border-white/5"
          >
            <div className="p-6 space-y-3">
              {vote.options.map(opt => {
                const isSelected = selected.includes(opt.id);
                const isMyVote = vote.myOptionIds.includes(opt.id);

                return (
                  <button
                    key={opt.id}
                    onClick={() => onOptionSelect(vote, opt.id)}
                    disabled={vote.isExpired}
                    className={`w-full text-left transition-all group ${vote.isExpired ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                      isSelected
                        ? 'border-[#11B886] bg-[#11B886]/5'
                        : 'border-gray-100 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/15'
                    }`}>
                      <div className="flex-shrink-0">
                        {vote.isMultiple ? (
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-[#11B886] border-[#11B886]' : 'border-gray-300 dark:border-white/20'}`}>
                            {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                          </div>
                        ) : (
                          isSelected
                            ? <CheckCircle2 className="w-5 h-5 text-[#11B886]" />
                            : <Circle className="w-5 h-5 text-gray-300 dark:text-white/20" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[14px] font-bold transition-colors ${isSelected ? 'text-[#11B886]' : 'text-[#1A2340] dark:text-white'}`}>
                            {opt.text}
                          </span>
                          <div className="flex items-center gap-2">
                            {isMyVote && !hasChanged && (
                              <span className="text-[10px] font-black text-[#11B886] uppercase tracking-widest">내 선택</span>
                            )}
                            <span className="text-[12px] font-black text-gray-400 dark:text-white/30">
                              {opt.voteCount}표 ({opt.percentage}%)
                            </span>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${isMyVote && !hasChanged ? 'bg-[#11B886]' : 'bg-gray-300 dark:bg-white/20'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${opt.percentage}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* 투표 버튼 */}
              {!vote.isExpired && (
                <div className="pt-2">
                  {selected.length > 0 && hasChanged ? (
                    <button
                      onClick={() => onCastVote(vote)}
                      className="w-full py-3.5 bg-[#11B886] text-white rounded-2xl font-black uppercase tracking-widest text-[13px] shadow-[0_4px_16px_rgba(17,184,134,0.3)] hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {hasVoted ? '재투표 하기' : '투표 하기'}
                    </button>
                  ) : selected.length === 0 && !hasVoted ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-[12px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">
                      <AlertCircle className="w-4 h-4" />
                      선택지를 클릭하세요
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed preview (not expanded, show top option) */}
      {!isExpanded && vote.options.length > 0 && (
        <div className="px-6 pb-5">
          <div className="space-y-2">
            {vote.options.slice(0, 3).map(opt => (
              <div key={opt.id} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-white/10 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-bold text-gray-600 dark:text-white/60 truncate">{opt.text}</span>
                    <span className="text-[11px] font-black text-gray-400 dark:text-white/30 ml-2 flex-shrink-0">{opt.percentage}%</span>
                  </div>
                  <div className="h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${vote.myOptionIds.includes(opt.id) ? 'bg-[#11B886]' : 'bg-gray-300 dark:bg-white/15'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${opt.percentage}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {vote.options.length > 3 && (
              <p className="text-[11px] text-gray-400 dark:text-white/20 font-medium">+{vote.options.length - 3}개 더보기...</p>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
