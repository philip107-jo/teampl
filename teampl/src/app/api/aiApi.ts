import { apiClient } from './client';

export interface AiTaskSuggestion {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  deadline: string;
  difficulty: number;
}

export const aiApi = {
  splitTasks: async (projectId: number, prompt: string): Promise<AiTaskSuggestion[]> => {
    const response = await apiClient.post(`/projects/${projectId}/ai/split-tasks`, { prompt });
    return response.data;
  }
};
