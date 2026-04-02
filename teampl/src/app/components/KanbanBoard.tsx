import React from 'react';
import { KanbanColumn } from './KanbanColumn';
import { Task, TaskStatus } from '../types';

interface KanbanBoardProps {
  tasks: Task[];
  onMoveTask: (taskId: string, targetStatus: TaskStatus) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (e: React.MouseEvent, taskId: string) => void;
}

export default function KanbanBoard({ tasks, onMoveTask, onToggleTask, onDeleteTask }: KanbanBoardProps) {
  const columns: { status: TaskStatus; title: string }[] = [
    { status: 'TODO', title: '대기 중' },
    { status: 'IN_PROGRESS', title: '진행 중' },
    { status: 'DONE', title: '완료됨' },
  ];

  return (
    <div className="flex h-full gap-6 overflow-x-auto pb-4 scrollbar-hide animate-in fade-in slide-in-from-right-8 duration-500">
      {columns.map((col) => (
        <KanbanColumn
          key={col.status}
          status={col.status}
          title={col.title}
          tasks={tasks.filter((t) => t.status === col.status)}
          onMoveTask={onMoveTask}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
        />
      ))}
    </div>
  );
}
