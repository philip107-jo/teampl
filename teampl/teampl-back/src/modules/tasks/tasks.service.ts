// 이 파일은 프론트엔드 모의 데이터와 일치하는 임시 저장소와 서비스 로직입니다.
export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  status: string;
  priority: string;
  difficulty: number;
  deadline: string;
  completedAt?: string;
  createdById: string;
  assignees: string[];
}

let mockTasks: Task[] = [
  {
    id: 'task-1',
    workspaceId: 'workspace-1',
    title: '프로젝트 기획안 작성',
    status: 'TODO',
    priority: 'high',
    difficulty: 3,
    deadline: '2026-04-01',
    createdById: 'user-1',
    assignees: ['user-1']
  }
];

let userTasksStore: Record<string, Task[]> = {
  'test@naver.com': [...mockTasks]
};

export const TasksService = {
  getAll: (email: string) => {
    if (email === 'test@naver.com') return userTasksStore['test@naver.com'];
    return userTasksStore[email] || [];
  },

  create: (email: string, data: Partial<Task>) => {
    if (!userTasksStore[email]) {
      if (email === 'test@naver.com') userTasksStore[email] = [...mockTasks];
      else userTasksStore[email] = [];
    }
    const tasks = userTasksStore[email];

    const newTask: Task = {
      id: `task-${Date.now()}`,
      workspaceId: data.workspaceId || 'workspace-1',
      title: data.title || '새 태스크',
      status: data.status || 'TODO',
      priority: data.priority || 'medium',
      difficulty: data.difficulty || 3,
      deadline: data.deadline || new Date().toISOString().split('T')[0],
      createdById: data.createdById || 'user-1',
      assignees: data.assignees || [],
    };
    userTasksStore[email] = [newTask, ...tasks];
    return newTask;
  },

  updateStatus: (email: string, id: string, status: string) => {
    const tasks = userTasksStore[email] || [];
    const task = tasks.find(t => t.id === id);
    if (!task) return null;
    task.status = status;
    if (status === 'DONE') {
      task.completedAt = new Date().toISOString().split('T')[0];
    }
    return task;
  },

  deleteByWorkspaceId: (email: string, workspaceId: string) => {
    if (!userTasksStore[email]) return;
    userTasksStore[email] = userTasksStore[email].filter(t => t.workspaceId !== workspaceId);
  }
};
