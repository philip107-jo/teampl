import React, { useState, useRef } from "react";
import { X, UploadCloud, File, FileImage, FileType2, Trash2, Plus, Check, Sparkles } from "lucide-react";
import { taskApi } from "../api/taskApi";
import { aiApi, AiEvaluationResponse } from "../api/aiApi";
import { Task } from "../types";
import { AiEvaluationModal } from "./AiEvaluationModal";
import { SubscriptionPaywallModal } from "./SubscriptionPaywallModal";

interface TaskSubmitModalProps {
  projectId: number;
  task: Task;
  onClose: () => void;
  onSuccess: () => void;
}

function getFileIcon(file: File) {
  if (file.type.startsWith("image/")) return FileImage;
  if (file.type === "application/pdf") return FileType2;
  return File;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function TaskSubmitModal({ projectId, task, onClose, onSuccess }: TaskSubmitModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Review States
  const [useAiReview, setUseAiReview] = useState(false);
  const [reportText, setReportText] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<AiEvaluationResponse | null>(null);
  const [isAiEvalModalOpen, setIsAiEvalModalOpen] = useState(false);
  
  // Paywall States
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [paywallMessage, setPaywallMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => {
        const existingNames = new Set(prev.map(f => f.name));
        const unique = newFiles.filter(f => !existingNames.has(f.name));
        return [...prev, ...unique];
      });
    }
    // reset so same file can be re-added after removal
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      return [...prev, ...dropped.filter(f => !existingNames.has(f.name))];
    });
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      setError("최소 1개의 산출물 파일을 선택해주세요.");
      return;
    }
    if (useAiReview && !reportText.trim()) {
      setError("AI 검토를 위한 텍스트를 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await taskApi.submitTaskForReview(projectId, task.id, files);
      
      if (useAiReview && reportText.trim()) {
        setIsEvaluating(true);
        const evalResult = await aiApi.evaluateProject(projectId, reportText);
        setEvaluationResult(evalResult);
        setIsAiEvalModalOpen(true);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      const statusCode = err.response?.status || err.status;
      if (statusCode === 402) {
        setPaywallMessage(err.response?.data?.message || 'AI 검토를 사용하려면 PRO 요금제가 필요합니다.');
        setIsPaywallOpen(true);
      } else {
        setError(err.response?.data?.message || err.message || "산출물 제출 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
      setIsEvaluating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1A2340] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-lg font-black text-[#1A2340] dark:text-white">산출물 제출 및 검토 요청</h2>
              <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[300px]">[{task.title}]</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Drop Zone */}
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
          >
            <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-600 dark:text-gray-300">클릭하거나 파일을 드래그하세요</p>
            <p className="text-xs text-gray-400 mt-1">여러 파일 동시 선택 가능 · 최대 100MB</p>
            <input
              type="file"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">선택된 파일 ({files.length}개)</p>
              {files.map((file, i) => {
                const Icon = getFileIcon(file);
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-gray-800 dark:text-white truncate">{file.name}</p>
                      <p className="text-[10px] text-gray-400">{formatBytes(file.size)}</p>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-gray-300 dark:border-white/20 text-gray-400 hover:text-[#11B886] hover:border-[#11B886] rounded-xl text-[12px] font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> 파일 추가
              </button>
            </div>
          )}

          {/* AI Review Toggle & Input */}
          <div className="mt-5 border-t border-gray-100 dark:border-white/5 pt-5">
            <label className="flex items-center gap-3 cursor-pointer group w-fit">
              <input 
                type="checkbox" 
                className="hidden" 
                checked={useAiReview} 
                onChange={(e) => setUseAiReview(e.target.checked)} 
              />
              <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${useAiReview ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-white/10 group-hover:bg-gray-300 dark:group-hover:bg-white/20'}`}>
                {useAiReview && <Check className="w-3.5 h-3.5 text-white" />}
              </div>
              <span className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                산출물 텍스트 AI 검토 받기 (선택사항)
              </span>
            </label>

            {useAiReview && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="작성한 보고서나 산출물의 핵심 내용을 텍스트로 붙여넣어 주세요..."
                  className="w-full h-32 px-4 py-3 bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none text-sm dark:text-white"
                />
              </div>
            )}
          </div>

          {error && <p className="text-red-500 text-xs mt-3 text-center">{error}</p>}

          <div className="mt-5 flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10 transition-colors">
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || files.length === 0 || isEvaluating}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 flex items-center gap-2 ${useAiReview ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-[#11B886] hover:bg-[#0EA271]'}`}
            >
              {(loading || isEvaluating) && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isEvaluating ? 'AI 평가 중...' : useAiReview ? '제출 및 AI 검토 시작' : `검토 요청하기 ${files.length > 0 ? `(${files.length}개)` : ''}`}
            </button>
          </div>
        </div>
      </div>

      {/* AI Evaluation Result Modal */}
      {evaluationResult && (
        <AiEvaluationModal
          isOpen={isAiEvalModalOpen}
          onClose={() => {
            setIsAiEvalModalOpen(false);
            onSuccess();
          }}
          projectId={projectId}
          existingReport={evaluationResult}
        />
      )}

      {/* Paywall Modal */}
      <SubscriptionPaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        message={paywallMessage}
        onSuccess={() => {
          setIsPaywallOpen(false);
          // 닫기만 하고 사용자가 다시 제출 버튼을 누를 수 있도록 둠
        }}
      />
    </div>
  );
}
