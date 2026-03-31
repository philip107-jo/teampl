import React from 'react';
import { useDrag } from 'react-dnd';
import { Clock, MoreHorizontal } from 'lucide-react';
import { Task } from '../types';
import { initialMembers } from '../mockData';

interface KanbanCardProps {
  task: Task;
  onToggle: (id: string) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ task, onToggle }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TASK',
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-[#FF6B7A] bg-[#FF6B7A]/10 border-[#FF6B7A]/20";
      case "medium": return "text-[#FFB547] bg-[#FFB547]/10 border-[#FFB547]/20";
      case "low": return "text-[#7C6CFF] bg-[#7C6CFF]/10 border-[#7C6CFF]/20";
      default: return "text-[#7D879C]/80 dark:text-white/40 bg-white/50 dark:bg-white/5 border-gray-300 dark:border-white/10";
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
        <span className={`text-[9px] font-black px-2.5 py-1 rounded-[10px] uppercase tracking-widest border ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        <button className="p-1 hover:bg-white/60 dark:bg-white/10 rounded-lg text-gray-300 dark:text-white/20 hover:text-[#1A2340] dark:text-white transition-colors">
          <MoreHorizontal className="w-4 h-4" />
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
        <div className="flex -space-x-2">
          {task.assignees.map((uid) => (
            <div key={uid} className="w-7 h-7 rounded-full bg-white dark:bg-[#12182B] border-2 border-[#1A2340] flex items-center justify-center text-[#7D879C] dark:text-white/80 text-[10px] font-black group relative uppercase shadow-sm">
              {initialMembers.find(m => m.id === uid)?.name[0]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
