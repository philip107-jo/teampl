import React from 'react';
import { useDrop } from 'react-dnd';
import { KanbanCard } from './KanbanCard';
import { Task, TaskStatus } from '../types';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  projectMembers: any[];
  onMoveTask: (taskId: string, targetStatus: TaskStatus) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (e: React.MouseEvent, taskId: string) => void;
  onClaimTask?: (taskId: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  tasks,
  projectMembers,
  onMoveTask,
  onToggleTask,
  onDeleteTask,
  onClaimTask,
}) => {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'TASK',
    drop: (item: { id: string }) => onMoveTask(item.id, status),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  const getStatusColor = (s: TaskStatus) => {
    switch (s) {
      case 'TODO': return 'bg-white/20 shadow-none';
      case 'IN_PROGRESS': return 'bg-[#11B886] shadow-[0_0_10px_rgba(17,184,134,0.4)]';
      case 'DONE': return 'bg-[#23D7A1] shadow-[0_0_10px_rgba(35,215,161,0.4)]';
      default: return 'bg-white/20';
    }
  };

  return (
    <div
      ref={drop as any}
      className={`flex flex-col w-full min-w-[320px] h-full rounded-[40px] p-6 transition-all border ${
        isOver && canDrop ? 'bg-white/50 dark:bg-white/5 border-[#11B886]/30 shadow-[0_0_30px_rgba(17,184,134,0.1)]' : 'bg-white dark:bg-[#12182B] border-gray-200 dark:border-white/5'
      }`}
    >
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(status)}`}></div>
          <h3 className="font-black text-[#1A2340] dark:text-white text-[15px] tracking-tight">{title}</h3>
          <span className="text-[11px] font-black text-[#7D879C] dark:text-white/50 bg-white/40 dark:bg-[#1A2340] border border-gray-300 dark:border-white/10 px-3 py-1 rounded-xl shadow-sm">
            {tasks.length}
          </span>
        </div>
        <button className="p-2 hover:bg-white/60 dark:bg-white/10 hover:text-[#1A2340] dark:text-white rounded-xl text-[#7D879C]/80 dark:text-white/40 transition-all">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide pb-4">
        {tasks.map((task) => (
          <KanbanCard 
            key={task.id} 
            task={task} 
            projectMembers={projectMembers}
            onToggle={onToggleTask} 
            onDelete={onDeleteTask} 
            onClaim={onClaimTask}
          />
        ))}
        {tasks.length === 0 && (
          <div className="h-24 border-2 border-dashed border-gray-200 dark:border-white/5 rounded-[24px] flex items-center justify-center text-gray-300 dark:text-white/20 text-xs font-black uppercase tracking-widest">
            항목 없음
          </div>
        )}
      </div>
    </div>
  );
};
