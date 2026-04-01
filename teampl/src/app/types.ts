export type User = {
  id: string;
  email: string;
  name: string;
  studentId?: string;
  department?: string;
  avatarUrl?: string;
  avatarColor?: string;
};

export type Workspace = {
  id: string;
  name: string;
  subject?: string;
  notice?: string;
  deadline?: string;
  inviteCode: string;
};

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export type Task = {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: 'high' | 'medium' | 'low';
  difficulty: number; // 1-5
  deadline?: string;
  completedAt?: string;
  createdById: string;
  assignees: string[]; // User IDs
};

export type ChatMessage = {
  id: string;
  workspaceId: string;
  userId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO';
  fileUrl?: string;
  createdAt: string;
};
