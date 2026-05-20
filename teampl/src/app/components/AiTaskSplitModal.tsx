import React, { useState } from "react";
import { X, Sparkles, Loader2, Users, FileText, LayoutList, Check, ArrowLeft, CheckCircle2 } from "lucide-react";
import { aiApi, AiTaskSuggestion } from "../api/aiApi";
import { taskApi } from "../api/taskApi";

interface AiTaskSplitModalProps {
  projectId: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AiTaskSplitModal({ projectId, isOpen, onClose, onSuccess }: AiTaskSplitModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [teamSize, setTeamSize] = useState<number>(4);
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [suggestions, setSuggestions] = useState<AiTaskSuggestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const handleRequestAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("주제를 입력해주세요.");
      return;
    }
    if (!description.trim()) {
      setError("상세 설명을 입력해주세요.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // 1. Request AI to split tasks
      const results = await aiApi.splitTasks(projectId, teamSize, topic, description);
      
      if (!results || results.length === 0) {
        throw new Error("AI가 태스크를 분할하지 못했습니다.");
      }

      setSuggestions(results);
      // By default, select all suggestions
      setSelectedIds(new Set(results.map(r => r.id)));
      setStep(2); // Move to Step 2
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "AI 업무 분할 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const handleToggleAll = () => {
    if (selectedIds.size === suggestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(suggestions.map(s => s.id)));
    }
  };

  const handleSubmitSelected = async () => {
    if (selectedIds.size === 0) {
      setError("등록할 태스크를 최소 1개 이상 선택해주세요.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const selectedTasks = suggestions.filter(s => selectedIds.has(s.id));
      
      const newTasks = selectedTasks.map(s => ({
        projectId,
        title: s.title,
        status: "TODO" as const,
        priority: s.priority,
        deadline: s.deadline || new Date().toISOString().split('T')[0],
      }));

      // Batch create tasks
      await taskApi.batchCreateTasks(projectId, newTasks);
      
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.message || "업무 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FF4D4D]/10 text-[#FF4D4D]">긴급</span>;
      case "medium": return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFA500]/10 text-[#FFA500]">보통</span>;
      case "low": return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#4D94FF]/10 text-[#4D94FF]">여유</span>;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => !loading && onClose()}
      />
      
      {/* Modal */}
      <div className="bg-white dark:bg-[#151C31] rounded-[32px] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col border border-white/20 dark:border-white/10 animate-in fade-in zoom-in duration-300">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#7C6CFF]/10 rounded-bl-full -z-10 blur-3xl pointer-events-none" />
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7C6CFF]/20 flex items-center justify-center text-[#7C6CFF]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-[#1A2340] dark:text-white tracking-tight">
                {step === 1 ? "AI 업무 분할" : "분할된 업무 확인"}
              </h3>
              <p className="text-sm font-bold text-[#7D879C] mt-0.5">
                {step === 1 ? "AI가 큰 목표를 세부 태스크로 쪼개줍니다." : "등록할 업무를 선택해주세요."}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={loading}
            className="p-2 text-[#7D879C] hover:text-[#1A2340] dark:hover:text-white bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-2xl flex items-center gap-2">
              <X className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestAi} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1A2340] dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#7C6CFF]" />
                  팀 규모 (인원수)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={teamSize}
                  onChange={(e) => setTeamSize(parseInt(e.target.value) || 1)}
                  className="w-full bg-gray-50 dark:bg-[#0d1526] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-[15px] text-[#1A2340] dark:text-white font-medium focus:ring-2 focus:ring-[#7C6CFF]/30 focus:border-[#7C6CFF] outline-none transition-all"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1A2340] dark:text-white flex items-center gap-2">
                  <LayoutList className="w-4 h-4 text-[#7C6CFF]" />
                  과제 주제
                </label>
                <input
                  type="text"
                  placeholder="예: 사용자 로그인 화면 개발"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-[#0d1526] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-[15px] text-[#1A2340] dark:text-white font-medium focus:ring-2 focus:ring-[#7C6CFF]/30 focus:border-[#7C6CFF] outline-none transition-all placeholder:text-[#7D879C]/60"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1A2340] dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#7C6CFF]" />
                  상세 설명
                </label>
                <textarea
                  placeholder="예: 프론트엔드 UI를 만들고 백엔드 API와 연동해야 합니다. 기한은 다음주 금요일까지입니다."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-gray-50 dark:bg-[#0d1526] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-[15px] text-[#1A2340] dark:text-white font-medium focus:ring-2 focus:ring-[#7C6CFF]/30 focus:border-[#7C6CFF] outline-none transition-all resize-none placeholder:text-[#7D879C]/60"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-4 bg-[#7C6CFF] hover:bg-[#6A5BDB] text-white rounded-2xl text-[15px] font-black transition-all shadow-[0_0_20px_rgba(124,108,255,0.3)] active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    AI가 업무를 분석하고 있습니다...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    AI에게 분할 요청하기
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[#7D879C] dark:text-white/60">
                  총 {suggestions.length}개의 추천 업무
                </span>
                <button 
                  onClick={handleToggleAll}
                  className="text-sm font-bold text-[#7C6CFF] hover:text-[#6A5BDB] transition-colors flex items-center gap-1"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {selectedIds.size === suggestions.length ? "전체 해제" : "전체 선택"}
                </button>
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {suggestions.map((suggestion) => {
                  const isSelected = selectedIds.has(suggestion.id);
                  return (
                    <div 
                      key={suggestion.id}
                      onClick={() => handleToggleSelect(suggestion.id)}
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        isSelected 
                          ? "bg-[#7C6CFF]/5 border-[#7C6CFF]/30 dark:border-[#7C6CFF]/30" 
                          : "bg-gray-50 dark:bg-[#0d1526] border-gray-200 dark:border-white/5 opacity-60"
                      }`}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center transition-colors ${
                        isSelected ? "bg-[#7C6CFF] text-white" : "bg-gray-200 dark:bg-white/10"
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[15px] font-bold truncate ${isSelected ? "text-[#1A2340] dark:text-white" : "text-[#7D879C] dark:text-white/40 line-through"}`}>
                            {suggestion.title}
                          </span>
                          {getPriorityBadge(suggestion.priority)}
                        </div>
                        {suggestion.deadline && (
                          <div className="text-xs font-bold text-[#7D879C]/80 dark:text-white/40">
                            마감: {suggestion.deadline}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 mt-4 pt-2 border-t border-gray-100 dark:border-white/5">
                <button
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="px-4 py-3.5 text-sm font-bold text-[#7D879C] bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-all disabled:opacity-50"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSubmitSelected}
                  disabled={loading || selectedIds.size === 0}
                  className="flex-1 py-3.5 bg-[#11B886] hover:bg-[#0EA271] text-white rounded-xl text-[15px] font-black transition-all shadow-[0_0_20px_rgba(17,184,134,0.3)] active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      {selectedIds.size}개 선택 등록
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
