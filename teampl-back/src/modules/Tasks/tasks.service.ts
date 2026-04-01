import { prisma } from '../../prisma';

export interface Task {
  id: string;
  workspaceId?: string;
  title: string;
  status: string;
  priority: string;
  deadline: string;
  ownerEmail?: string;
  assignees?: string[];
}

export const TasksService = {
  getAll: async (email: string) => {
    if (!email) return [];
    return await prisma.task.findMany({
        where: { ownerEmail: email },
        orderBy: { createdAt: 'desc' }
    });
  },

  create: async (email: string, data: Partial<Task>) => {
    return await prisma.task.create({
      data: {
        workspaceId: data.workspaceId || 'workspace-1',
        title: data.title || '새 태스크',
        status: data.status || 'TODO',
        priority: data.priority || 'medium',
        deadline: data.deadline || new Date().toISOString().split('T')[0],
        ownerEmail: email || 'unknown',
        assignees: data.assignees || [],
      }
    });
  },

  updateStatus: async (email: string, id: string, status: string) => {
    return await prisma.task.update({
        where: { id },
        data: { status }
    });
  },

  deleteByWorkspaceId: async (email: string, workspaceId: string) => {
    await prisma.task.deleteMany({
        where: { workspaceId }
    });
  }
};
