export type User = {
  id: string;
  email: string;
  name: string;
  studentId?: string;
  department?: string;
  avatarUrl?: string;
  avatarColor?: string;
  plan?: 'FREE' | 'PRO';
  aiUsageCount?: number;
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
  assignees?: string[]; // User IDs
  requiresDeliverable?: boolean;
  
  submitterEmail?: string;
  deliverables?: TaskDeliverable[];
  approvals?: { id: number; taskId: string; userEmail: string; createdAt: string }[];
  unreadCommentBy?: string[];
};

export type TaskDeliverable = {
  id: number;
  taskId: string;
  originalName: string;
  type: string;
  size: number;
  url: string;
  uploaderEmail: string;
  createdAt: string;
};

export type TaskComment = {
  id: number;
  taskId: string;
  userEmail: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  isAnonymous?: boolean;
  anonymousName?: string;
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
