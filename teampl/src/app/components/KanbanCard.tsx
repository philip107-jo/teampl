import React from 'react';
import { useDrag } from 'react-dnd';
import { Clock, CheckCircle2, Circle, MoreHorizontal } from 'lucide-react';
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
      case "high": return "text-red-600 bg-red-50 border-red-100";
      case "medium": return "text-orange-600 bg-orange-50 border-orange-100";
      case "low": return "text-blue-600 bg-blue-50 border-blue-100";
      default: return "text-gray-600 bg-gray-50 border-gray-100";
    }
  };

  return (
    <div
      ref={drag as any}
      className={`bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-40 grayscale scale-95' : 'opacity-100'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        <button className="p-1 hover:bg-gray-50 rounded-lg text-gray-300 transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      
      <h4 className={`text-sm font-bold text-gray-900 leading-snug mb-3 ${task.status === 'DONE' ? 'line-through text-gray-400' : ''}`}>
        {task.title}
      </h4>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
          <Clock className="w-3 h-3" />
          {task.deadline ? task.deadline.split('-').slice(1).join('/') : '기한 없음'}
        </div>
        <div className="flex -space-x-2">
          {task.assignees.map((uid) => (
            <div key={uid} className="w-6 h-6 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center text-white text-[9px] font-black group relative">
              {initialMembers.find(m => m.id === uid)?.name[0]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
