import { apiClient } from './client';
import { Task, TaskStatus } from '../types';

export const taskApi = {
  getTasks: async (projectId: number): Promise<Task[]> => {
    const response = await apiClient.get(`/projects/${projectId}/tasks`);
    return response.data;
  },

  createTask: async (projectId: number, taskData: Partial<Task>): Promise<Task> => {
    const response = await apiClient.post(`/projects/${projectId}/tasks`, taskData);
    return response.data;
  },

  updateTaskStatus: async (projectId: number, taskId: string, status: TaskStatus): Promise<void> => {
    await apiClient.patch(`/projects/${projectId}/tasks/${taskId}`, { status });
  },

  updateTaskAssignees: async (projectId: number, taskId: string, assignees: string[]): Promise<void> => {
    await apiClient.patch(`/projects/${projectId}/tasks/${taskId}/assignees`, { assignees });
  },

  deleteTask: async (projectId: number, taskId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/tasks/${taskId}`);
  },

  batchCreateTasks: async (projectId: number, tasks: Partial<Task>[]): Promise<Task[]> => {
    const response = await apiClient.post(`/projects/${projectId}/tasks/batch`, { tasks });
    return response.data;
  }
};
