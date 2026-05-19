import React from 'react';
import { useDrag } from 'react-dnd';
import { Clock, Trash2 } from 'lucide-react';
import { Task } from '../types';

interface KanbanCardProps {
  task: Task;
  projectMembers: any[];
  onToggle: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onClaim?: (id: string) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ task, projectMembers = [], onToggle, onDelete, onClaim }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TASK',
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-[#FF4D4D] bg-[#FF4D4D]/10 border-[#FF4D4D]/20 shadow-[0_0_15px_rgba(255,77,77,0.1)]";
      case "medium": return "text-[#FFA500] bg-[#FFA500]/10 border-[#FFA500]/20 shadow-[0_0_15px_rgba(255,165,0,0.1)]";
      case "low": return "text-[#4D94FF] bg-[#4D94FF]/10 border-[#4D94FF]/20 shadow-[0_0_15px_rgba(77,148,255,0.1)]";
      default: return "text-[#7D879C]/80 dark:text-white/40 bg-white/50 dark:bg-white/5 border-gray-300 dark:border-white/10";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high": return "긴급";
      case "medium": return "보통";
      case "low": return "여유";
      default: return priority.toUpperCase();
    }
  };

  return (
    <div
      ref={drag as any}
      className={`card !p-5 hover:bg-white/40 dark:bg-[#1A2340] hover:border-gray-300 dark:border-white/20 cursor-grab active:cursor-grabbing hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all ${
        isDragging ? 'opacity-40 grayscale scale-95' : 'opacity-100'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <span className={`text-[10px] font-black px-2.5 py-1 rounded-[10px] uppercase tracking-widest border transition-all ${getPriorityColor(task.priority)}`}>
          {getPriorityLabel(task.priority)}
        </span>
        <button onClick={(e) => onDelete(e, task.id)} className="p-1 hover:bg-[#FF6B7A]/10 rounded-lg text-[#7D879C]/50 hover:text-[#FF6B7A] transition-colors" title="태스크 삭제">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      <h4 className={`text-[15px] font-black leading-snug mb-4 transition-colors ${task.status === 'DONE' ? 'line-through text-[#7D879C]/80 dark:text-white/30' : 'text-[#1A2340] dark:text-white'}`}>
        {task.title}
      </h4>

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-200 dark:border-white/5">
        <div className="flex items-center gap-2 text-[10px] font-black text-[#7D879C]/80 dark:text-white/40 uppercase tracking-widest">
          <Clock className="w-3.5 h-3.5" />
          {task.deadline ? task.deadline.split('-').slice(1).join('/') : '기한 없음'}
        </div>
        <div className="flex items-center gap-2">
          {(!task.assignees || task.assignees.length === 0) ? (
            <button 
              onClick={() => onClaim?.(task.id)}
              className="px-3 py-1.5 bg-[#11B886]/10 hover:bg-[#11B886] text-[#11B886] hover:text-white text-[10px] font-black rounded-lg transition-all border border-[#11B886]/20"
            >
              나에게 배정
            </button>
          ) : (
            <div className="flex -space-x-2">
              {task.assignees.map((email: string) => {
                const m = projectMembers.find(mem => mem.email === email);
                return (
                  <div 
                    key={email} 
                    title={m?.name || "담당자"}
                    className="w-7 h-7 rounded-full bg-white dark:bg-[#12182B] border-2 border-[#1A2340] flex items-center justify-center text-[#7D879C] dark:text-white/80 text-[10px] font-black group relative uppercase shadow-sm"
                  >
                    {m?.name?.[0] || 'U'}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
