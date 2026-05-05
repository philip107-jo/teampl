import { apiClient } from './client';

export interface AiTaskSuggestion {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  deadline: string;
  difficulty: number;
}

export const aiApi = {
  splitTasks: async (projectId: number, teamSize: number, topic: string, description: string, termType: 'SHORT' | 'LONG'): Promise<AiTaskSuggestion[]> => {
    const response = await apiClient.post(`/projects/${projectId}/ai/split-tasks`, { teamSize, topic, description, termType });
    return response.data;
  }
};
