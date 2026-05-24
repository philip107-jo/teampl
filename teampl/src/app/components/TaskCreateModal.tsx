import React, { useState } from "react";
import { X } from "lucide-react";
import { taskApi } from "../api/taskApi";

interface TaskCreateModalProps {
  projectId: number;
  members: Array<{ email: string; name: string }>;
  initialStageId: number;
  onClose: () => void;
  onCreate: () => void;
}

const DEFAULT_STAGES = [
  { id: 1, title: '주제 선정' },
  { id: 2, title: '설문 설계' },
  { id: 3, title: '데이터 수집' },
  { id: 4, title: '분석' },
  { id: 5, title: '발표준비' }
];

export default function TaskCreateModal({
  projectId,
  members,
  initialStageId,
  onClose,
  onCreate
}: TaskCreateModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [requiresDeliverable, setRequiresDeliverable] = useState(true);
  const [selectedStageId, setSelectedStageId] = useState<number>(initialStageId);
  const [selectedAssigneeEmail, setSelectedAssigneeEmail] = useState<string>(
    members.length > 0 ? members[0].email : ""
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("태스크 제목을 입력해주세요.");
      return;
    }

    setLoading(true);
    // Prepend the selected stage tag automatically so it maps correct stage heuristics
    const prefixedTitle = `[${selectedStageId}단계] ${title.trim()}`;

    try {
      await taskApi.createTask(projectId, {
        title: prefixedTitle,
        description,
        status: "TODO",
        priority: "medium",
        difficulty: 3,
        deadline: deadline || undefined,
        ownerEmail: selectedAssigneeEmail,
        assignees: [selectedAssigneeEmail],
        requiresDeliverable,
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

          {/* Project Stage Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">프로젝트 단계</label>
            <select
              value={selectedStageId}
              onChange={(e) => setSelectedStageId(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-[#11B886] transition-colors text-gray-600"
            >
              {DEFAULT_STAGES.map(stage => (
                <option key={stage.id} value={stage.id}>
                  {stage.id}단계 · {stage.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">담당 팀원</label>
              <select
                value={selectedAssigneeEmail}
                onChange={(e) => setSelectedAssigneeEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:border-[#11B886] transition-colors text-gray-600"
              >
                {members.map(member => (
                  <option key={member.email} value={member.email}>
                    {member.name} ({member.email.split('@')[0]})
                  </option>
                ))}
              </select>
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

          <div className="flex items-center gap-2 pt-2 pb-1">
            <input 
              type="checkbox" 
              id="requiresDeliverable"
              checked={requiresDeliverable}
              onChange={(e) => setRequiresDeliverable(e.target.checked)}
              className="w-4 h-4 text-[#11B886] border-gray-300 rounded focus:ring-[#11B886]"
            />
            <label htmlFor="requiresDeliverable" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
              산출물 제출 필수 (이 과제를 완료하려면 파일 제출이 필요합니다)
            </label>
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
