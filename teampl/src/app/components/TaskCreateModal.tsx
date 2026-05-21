import React, { useState } from "react";
import { X, Calendar as CalendarIcon } from "lucide-react";
import { taskApi } from "../api/taskApi";

interface TaskCreateModalProps {
  projectId: number;
  assigneeEmail: string;
  assigneeName: string;
  initialStatus?: string;
  onClose: () => void;
  onCreate: () => void;
}

export default function TaskCreateModal({ projectId, assigneeEmail, assigneeName, initialStatus = "TODO", onClose, onCreate }: TaskCreateModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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
        status: initialStatus,
        priority: "medium", // Default priority since removed from UI
        difficulty: 3,      // Default difficulty since removed from UI
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">새 과제 추가</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">과제 제목</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="과제 제목을 입력하세요"
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-[#11B886] transition-colors placeholder-gray-400"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">설명</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="과제에 대한 설명"
              className="w-full h-28 px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm resize-none focus:outline-none focus:border-[#11B886] transition-colors placeholder-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">담당자</label>
              <input 
                type="text" 
                readOnly
                value={assigneeName}
                placeholder="담당자 이름"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-500 cursor-not-allowed outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">마감일</label>
              <div className="relative">
                <input 
                  type="date" 
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-[#11B886] transition-colors text-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 bg-[#11B886] hover:bg-[#0EA271] text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? "추가 중..." : "추가하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
