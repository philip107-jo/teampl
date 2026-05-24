import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Sparkles, AlertCircle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { aiApi, AiEvaluationResponse } from '../api/aiApi';
import { useToast } from '../context/ToastContext';

interface AiEvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  onEvaluationComplete?: (result: AiEvaluationResponse) => void;
  existingReport?: AiEvaluationResponse | null;
}

export function AiEvaluationModal({ isOpen, onClose, projectId, onEvaluationComplete, existingReport }: AiEvaluationModalProps) {
  const [reportText, setReportText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiEvaluationResponse | null>(existingReport || null);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleEvaluate = async () => {
    if (!reportText.trim()) {
      showToast('평가할 텍스트를 입력해주세요.', 'warning');
      return;
    }

    try {
      setLoading(true);
      const evalResult = await aiApi.evaluateProject(projectId, reportText);
      setResult(evalResult);
      onEvaluationComplete?.(evalResult);
      showToast('AI 평가가 완료되었습니다!', 'success');
    } catch (e: any) {
      if (e.response?.status === 402) {
        // 부모 컴포넌트(Overview 등)에서 402 에러 처리하여 Paywall 띄우도록 에러 던짐
        onClose();
        throw e;
      } else {
        showToast(e.response?.data?.message || '평가 중 오류가 발생했습니다.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#1A2340] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-[#1A2340]/80 backdrop-blur-md z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">AI 최종 산출물 평가</h3>
                <p className="text-xs text-gray-500 dark:text-white/50">프로젝트 최종 결과를 분석하고 피드백을 제공합니다.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white/80 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {!result ? (
              // 입력 화면
              <div className="space-y-6">
                <div className="bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-xl flex gap-3 text-sm text-indigo-800 dark:text-indigo-200">
                  <FileText className="w-5 h-5 shrink-0" />
                  <p>완성된 최종 보고서나 산출물의 내용을 아래에 붙여넣어 주세요. AI가 초기 기획 의도와 비교하여 전문적인 피드백을 제공합니다.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-white/80 mb-2">
                    산출물 텍스트 입력
                  </label>
                  <textarea
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    placeholder="여기에 보고서 내용을 붙여넣으세요..."
                    className="w-full h-64 px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none text-sm dark:text-white"
                  />
                </div>

                <button
                  onClick={handleEvaluate}
                  disabled={loading || !reportText.trim()}
                  className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      AI가 산출물을 정밀 분석 중입니다...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      평가 시작하기
                    </>
                  )}
                </button>
              </div>
            ) : (
              // 결과 화면 (성적표)
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Score Section */}
                <div className="flex flex-col items-center justify-center text-center p-8 bg-gradient-to-b from-indigo-500/10 to-transparent rounded-3xl border border-indigo-500/20">
                  <div className="w-32 h-32 mb-4 relative flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="60" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-gray-100 dark:text-white/5" />
                      <motion.circle 
                        cx="64" cy="64" r="60" 
                        fill="transparent" 
                        stroke="currentColor" 
                        strokeWidth="8" 
                        strokeDasharray={377}
                        initial={{ strokeDashoffset: 377 }}
                        animate={{ strokeDashoffset: 377 - (377 * result.score) / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={result.score >= 80 ? "text-green-500" : result.score >= 60 ? "text-indigo-500" : "text-amber-500"} 
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-gray-900 dark:text-white">{result.score}</span>
                      <span className="text-xs font-bold text-gray-500">/ 100</span>
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI 종합 평가</h4>
                  <p className="text-sm text-gray-600 dark:text-white/70 max-w-md mx-auto leading-relaxed">
                    {result.summary}
                  </p>
                </div>

                {/* Feedback Grid */}
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <div className="bg-green-50/50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold mb-4">
                      <TrendingUp className="w-5 h-5" />
                      잘한 점 (Strengths)
                    </div>
                    <ul className="space-y-3">
                      {result.strengths.map((str, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-gray-700 dark:text-white/80">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-green-500 mt-0.5" />
                          <span className="leading-relaxed">{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="bg-amber-50/50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl p-5">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold mb-4">
                      <TrendingDown className="w-5 h-5" />
                      보완점 (Needs Improvement)
                    </div>
                    <ul className="space-y-3">
                      {result.weaknesses.map((weak, idx) => (
                        <li key={idx} className="flex gap-2 text-sm text-gray-700 dark:text-white/80">
                          <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                          <span className="leading-relaxed">{weak}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setResult(null)}
                    className="px-6 py-2.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-white font-bold rounded-xl transition-colors text-sm"
                  >
                    다른 산출물 다시 평가하기
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
