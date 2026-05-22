import { apiClient } from './client';

export interface AiTaskSuggestion {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  deadline: string;
  difficulty: number;
  assignees?: string[];
  stageId?: number;
}

export interface Stage {
  id: number;
  title: string;
  description: string;
  keywords?: string[];
}

export interface AiSplitResponse {
  stages: Stage[];
  tasks: AiTaskSuggestion[];
}

export const aiApi = {
  splitTasks: async (projectId: number, teamSize: number, topic: string, description: string): Promise<AiSplitResponse> => {
    const response = await apiClient.post(`/projects/${projectId}/ai/split-tasks`, { teamSize, topic, description });
    return response.data;
  }
};
