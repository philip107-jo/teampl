import React, { useState, useRef } from "react";
import { X, UploadCloud, File, FileImage, FileType2, Trash2, Plus } from "lucide-react";
import { taskApi } from "../api/taskApi";
import { Task } from "../types";

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
    setLoading(true);
    setError("");
    try {
      await taskApi.submitTaskForReview(projectId, task.id, files);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "산출물 업로드에 실패했습니다.");
    } finally {
      setLoading(false);
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

          {error && <p className="text-red-500 text-xs mt-3 text-center">{error}</p>}

          <div className="mt-5 flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10 transition-colors">
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || files.length === 0}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#11B886] hover:bg-[#0EA271] text-white transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              검토 요청하기 {files.length > 0 && `(${files.length}개)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
