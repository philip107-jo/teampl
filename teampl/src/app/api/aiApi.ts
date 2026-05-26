import { aiClient } from './client';

export interface AiTaskSuggestion {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  deadline: string;
  difficulty: number;
  assignees?: string[];
  stageId?: number;
  requiresDeliverable?: boolean;
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

export interface AiEvaluationResponse {
  score: number;
  strengths: string[];
  weaknesses: string[];
  summary: string;
}

export const aiApi = {
  splitTasks: async (projectId: number, teamSize: number, topic: string, description: string): Promise<AiSplitResponse> => {
    const response = await aiClient.post(`/projects/${projectId}/ai/split-tasks`, { teamSize, topic, description });
    return response.data;
  },
  evaluateProject: async (projectId: number, reportText: string): Promise<AiEvaluationResponse> => {
    const response = await aiClient.post(`/projects/${projectId}/ai/evaluate`, { reportText });
    return response.data;
  }
};
