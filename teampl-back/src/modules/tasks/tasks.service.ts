import { prisma } from '../../prisma';

export interface Task {
  id: string;
  workspaceId?: string;
  title: string;
  status: string;
  priority: string;
  deadline: string;
  createdById?: string;
  assignees?: string[];
}

export const TasksService = {
  getAll: async (email: string) => {
    return await prisma.task.findMany({
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
        createdById: data.createdById || 'user-1',
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
