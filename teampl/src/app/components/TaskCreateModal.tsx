import React, { useState } from "react";
import { X, Save } from "lucide-react";
import { taskApi } from "../api/taskApi";

interface TaskCreateModalProps {
  projectId: number;
  assigneeEmail: string;
  assigneeName: string;
  onClose: () => void;
  onCreate: () => void;
}

export default function TaskCreateModal({ projectId, assigneeEmail, assigneeName, onClose, onCreate }: TaskCreateModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [difficulty, setDifficulty] = useState<number>(3);
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("태스크 제목을 입력해주세요.");
      return;
    }
    
    setLoading(true);
    try {
      await taskApi.createTask(projectId, {
        title,
        description,
        status: "TODO",
        priority,
        difficulty,
        deadline: deadline || "마감일 없음",
        ownerEmail: assigneeEmail,
        assignees: [assigneeEmail],
      } as any);
      onCreate();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "태스크 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1A2340] w-full max-w-lg rounded-[32px] shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-gray-100 dark:border-white/5">
          <div>
            <h2 className="text-xl font-black text-[#1A2340] dark:text-white">새로운 업무 할당</h2>
            <p className="text-sm font-bold text-[#7D879C] mt-1">{assigneeName} 님에게 배정할 태스크</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gray-600 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-[#7D879C] uppercase tracking-widest">업무 제목</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 메인 페이지 UI 디자인"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#12182B] border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#7C6CFF] transition-all dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-[#7D879C] uppercase tracking-widest">상세 설명</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="업무의 상세 내용을 입력해주세요 (선택)"
              className="w-full h-24 p-4 rounded-xl bg-gray-50 dark:bg-[#12182B] border border-gray-200 dark:border-white/10 text-sm resize-none focus:outline-none focus:border-[#7C6CFF] transition-all dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-[#7D879C] uppercase tracking-widest">우선순위</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#12182B] border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#7C6CFF] transition-all dark:text-white"
              >
                <option value="low">여유 (Low)</option>
                <option value="medium">보통 (Medium)</option>
                <option value="high">긴급 (High)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-[#7D879C] uppercase tracking-widest">난이도 (1~5)</label>
              <input 
                type="number" 
                min="1" max="5"
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#12182B] border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#7C6CFF] transition-all dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-[#7D879C] uppercase tracking-widest">마감일</label>
            <input 
              type="text" 
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              placeholder="예: 5월 20일"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#12182B] border border-gray-200 dark:border-white/10 text-sm focus:outline-none focus:border-[#7C6CFF] transition-all dark:text-white"
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#7C6CFF] hover:bg-[#6A5AE0] text-white font-black rounded-xl transition-all shadow-lg shadow-[#7C6CFF]/30 disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? "생성 중..." : "업무 생성 및 할당"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
