import { apiClient } from './client';

export interface AiTaskSuggestion {
  title: string;
  priority: 'high' | 'medium' | 'low';
  difficulty: number;
  deadline: string;
}

export const aiApi = {
  splitTasks: async (projectId: number, description: string): Promise<AiTaskSuggestion[]> => {
    const res = await apiClient.post(`/projects/${projectId}/ai/split`, { description });
    return res.data.tasks;
  }
};
