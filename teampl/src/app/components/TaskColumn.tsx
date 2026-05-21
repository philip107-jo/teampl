import React from 'react';
import { useDrop } from 'react-dnd';
import { Plus } from 'lucide-react';
import { Task, TaskStatus } from '../types';
import TaskCard from './TaskCard';

interface ColumnConfig {
  status: TaskStatus;
  label: string;
  color: string;
  bg: string;
  dot: string;
}

interface TaskColumnProps {
  col: ColumnConfig;
  colTasks: Task[];
  isLeader: boolean;
  currentUserEmail: string;
  priorityConfig: Record<string, { label: string; cls: string }>;
  nextStatus: Record<TaskStatus, TaskStatus>;
  columnsConfig: ColumnConfig[];
  updateStatus: (taskId: string, status: TaskStatus) => void;
  approveTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  setSelectedTask: (task: Task) => void;
  setCreateStatus: (status: TaskStatus) => void;
}

export default function TaskColumn({
  col, colTasks, isLeader, currentUserEmail, priorityConfig, nextStatus, columnsConfig, updateStatus, approveTask, deleteTask, setSelectedTask, setCreateStatus
}: TaskColumnProps) {
  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: 'TASK',
    drop: (item: { id: string }) => {
      updateStatus(item.id, col.status);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={dropRef as any}
      className={`flex flex-col rounded-2xl transition-all ${isOver ? "ring-2 ring-[#11B886] ring-offset-2" : ""}`}
    >
      <div className={`flex items-center justify-between px-4 py-3 rounded-t-2xl ${col.bg}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
          <span className={`text-[13px] font-black uppercase tracking-widest ${col.color}`}>
            {col.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${col.bg} ${col.color} border border-current/20`}>
            {colTasks.length}
          </span>
          <button
            onClick={() => setCreateStatus(col.status)}
            className={`p-1 rounded-lg hover:bg-black/5 transition-colors ${col.color}`}
            title="이 열에 과제 추가"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className={`flex flex-col gap-2 p-2 min-h-[120px] rounded-b-2xl ${col.bg} transition-colors`}>
        {colTasks.length === 0 ? (
          <div
            className="flex-1 flex items-center justify-center py-8 text-[12px] font-bold text-gray-400 dark:text-white/20 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl cursor-pointer"
            onClick={() => setCreateStatus(col.status)}
          >
            + 여기에 추가
          </div>
        ) : (
          colTasks.map(task => {
            const pCfg = priorityConfig[task.priority] || priorityConfig.medium;
            const isOverdue = task.deadline ? new Date(task.deadline) < new Date() && task.status !== "DONE" : false;
            const nxtStatus = nextStatus[task.status];
            const nxtStatusLabel = columnsConfig.find(c => c.status === nxtStatus)?.label;

            return (
              <TaskCard
                key={task.id}
                task={task}
                pCfg={pCfg}
                assignee={""} // member name mapping is handled differently or omitted for simplicity here
                isOverdue={isOverdue}
                isLeader={isLeader}
                currentUserEmail={currentUserEmail}
                nextStatus={nxtStatus}
                nextStatusLabel={nxtStatusLabel}
                updateStatus={updateStatus}
                approveTask={approveTask}
                deleteTask={deleteTask}
                setSelectedTask={setSelectedTask}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
