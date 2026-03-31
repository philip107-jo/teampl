import { apiClient } from './client';
import { Task, TaskStatus } from '../types';

export const taskApi = {
  // 1. 태스크 목록 가져오기 (GET)
  getTasks: async (): Promise<Task[]> => {
    // 실제 백엔드 연동 (/api/tasks)
    const response = await apiClient.get('/tasks');
    return response.data;
  },

  // 2. 새 태스크 생성하기 (POST)
  createTask: async (taskData: Partial<Task>): Promise<Task> => {
    // 실제 백엔드 연동 (/api/tasks)
    const response = await apiClient.post('/tasks', taskData);
    return response.data;
  },

  // 3. 태스크 상태 업데이트 (PATCH)
  updateTaskStatus: async (taskId: string, status: TaskStatus): Promise<void> => {
    // 실제 백엔드 연동 (/api/tasks/:id)
    await apiClient.patch(`/tasks/${taskId}`, { status });
  },
  
  // 4. 태스크 삭제 (DELETE)
  deleteTask: async (taskId: string): Promise<void> => {
    // 실제 백엔드 연동 (/api/tasks/:id)
    await apiClient.delete(`/tasks/${taskId}`);
  }
};
