import React from "react";
import { AlertCircle } from "lucide-react";

interface TaskDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  taskTitle?: string;
}

export default function TaskDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  taskTitle
}: TaskDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="card w-full max-w-[400px] shadow-[0_30px_60px_rgba(0,0,0,0.6)] !p-8 border border-red-500/20 dark:bg-[#132038]">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-[20px] flex items-center justify-center text-red-500 mb-6 shadow-inner mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-[20px] font-black text-center text-[#1A2340] dark:text-white tracking-tight leading-tight mb-3">정말 삭제하시겠습니까?</h2>
        <p className="text-[13px] font-bold text-center text-[#7D879C]/80 dark:text-white/40 mb-6 break-keep leading-relaxed">
          {taskTitle ? (
            <><span className="text-[#1A2340] dark:text-white">'{taskTitle}'</span> 과제를 삭제하시겠습니까? </>
          ) : (
            "이 과제를 삭제하시겠습니까? "
          )}
          삭제된 과제 정보와 산출물은 복구할 수 없습니다.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-[#7D879C] dark:text-white/60 rounded-xl font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all active:scale-95 border-none cursor-pointer"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-4 bg-red-500 text-white rounded-xl font-black uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:opacity-90 transition-all active:scale-95 border-none cursor-pointer"
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
}
