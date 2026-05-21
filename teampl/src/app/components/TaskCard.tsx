import React from 'react';
import { useDrag } from 'react-dnd';
import { ArrowRight, Trash2, GripVertical } from 'lucide-react';
import { Task, TaskStatus } from '../types';

interface TaskCardProps {
  task: Task;
  pCfg: { label: string; cls: string };
  assignee: string;
  isOverdue: boolean;
  isLeader: boolean;
  nextStatus: TaskStatus;
  nextStatusLabel?: string;
  updateStatus: (taskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string) => void;
  setSelectedTask: (task: Task) => void;
}

export default function TaskCard({
  task, pCfg, assignee, isOverdue, isLeader, nextStatus, nextStatusLabel, updateStatus, deleteTask, setSelectedTask
}: TaskCardProps) {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: 'TASK',
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={dragRef as any}
      onClick={() => setSelectedTask(task)}
      className={`bg-white dark:bg-[#1A2340] rounded-xl p-4 border shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all group select-none
        ${isDragging ? "opacity-40 scale-95" : "opacity-100"}
        ${isOverdue ? "border-red-200 dark:border-red-500/20" : "border-gray-100 dark:border-white/10"}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${pCfg.cls}`}>
          {pCfg.label}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); updateStatus(task.id, nextStatus); }}
            className="p-1 text-gray-400 hover:text-[#11B886] rounded-lg hover:bg-[#11B886]/10 transition-colors"
            title={`→ ${nextStatusLabel || '다음 상태'}`}
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          {isLeader && (
            <button
              onClick={e => { e.stopPropagation(); deleteTask(task.id); }}
              className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <GripVertical className="w-3.5 h-3.5 text-gray-300 dark:text-white/20" />
        </div>
      </div>

      <h3 className={`text-[13px] font-bold leading-snug mb-2 ${task.status === "DONE" ? "line-through text-gray-400 dark:text-white/30" : "text-[#1A2340] dark:text-white"}`}>
        {task.title}
      </h3>

      {task.description && (
        <p className="text-[11px] text-gray-400 dark:text-white/30 mb-3 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex -space-x-1">
          {task.assignees?.map(email => (
            <div key={email} className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 border-2 border-white dark:border-[#1A2340] flex items-center justify-center text-[8px] font-bold text-indigo-600 dark:text-indigo-400" title={email}>
              {email[0].toUpperCase()}
            </div>
          ))}
        </div>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isOverdue ? "bg-red-50 text-red-500 dark:bg-red-500/10" : "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-white/40"}`}>
          {task.deadline ? task.deadline.slice(5) : "-"}
        </span>
      </div>
    </div>
  );
}
