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
  },

  updateTaskDetails: async (projectId: number, taskId: string, data: { title?: string; description?: string }): Promise<void> => {
    await apiClient.patch(`/projects/${projectId}/tasks/${taskId}/details`, data);
  },

  getTaskComments: async (projectId: number, taskId: string): Promise<any[]> => {
    const response = await apiClient.get(`/projects/${projectId}/tasks/${taskId}/comments`);
    return response.data;
  },

  addTaskComment: async (projectId: number, taskId: string, content: string): Promise<any> => {
    const response = await apiClient.post(`/projects/${projectId}/tasks/${taskId}/comments`, { content });
    return response.data;
  },

  deleteTaskComment: async (projectId: number, taskId: string, commentId: number): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`);
  }
};
