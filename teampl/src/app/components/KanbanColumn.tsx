import React from 'react';
import { useDrop } from 'react-dnd';
import { KanbanCard } from './KanbanCard';
import { Task, TaskStatus } from '../types';
import { Plus, MoreHorizontal } from 'lucide-react';

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  onMoveTask: (taskId: string, targetStatus: TaskStatus) => void;
  onToggleTask: (taskId: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  tasks,
  onMoveTask,
  onToggleTask,
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
      case 'TODO': return 'bg-gray-100';
      case 'IN_PROGRESS': return 'bg-blue-500';
      case 'DONE': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div
      ref={drop as any}
      className={`flex flex-col w-full min-w-[300px] h-full rounded-[32px] p-4 transition-colors ${
        isOver && canDrop ? 'bg-indigo-50/50' : 'bg-gray-50/30'
      }`}
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(status)} shadow-sm`}></div>
          <h3 className="font-bold text-gray-900 text-sm tracking-tight">{title}</h3>
          <span className="text-xs font-bold text-gray-400 bg-white border border-gray-100 px-2 py-0.5 rounded-full shadow-sm">
            {tasks.length}
          </span>
        </div>
        <button className="p-1 hover:bg-white hover:shadow-sm rounded-lg text-gray-400 transition-all">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide pb-4">
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} onToggle={onToggleTask} />
        ))}
        {tasks.length === 0 && (
          <div className="h-24 border-2 border-dashed border-gray-100 rounded-3xl flex items-center justify-center text-gray-300 text-xs font-medium">
            항목 없음
          </div>
        )}
      </div>
    </div>
  );
};
