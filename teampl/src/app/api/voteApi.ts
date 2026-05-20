import { apiClient } from './client';

export interface VoteOption {
  id: number;
  text: string;
  order: number;
  voteCount: number;
  percentage: number;
  voters: string[];
}

export interface Vote {
  id: number;
  projectId: number;
  title: string;
  description?: string;
  isAnonymous: boolean;
  isMultiple: boolean;
  deadline?: string;
  creatorEmail: string;
  createdAt: string;
  isExpired: boolean;
  totalVotes: number;
  myOptionIds: number[];
  options: VoteOption[];
}

export interface CreateVoteData {
  title: string;
  description?: string;
  isAnonymous: boolean;
  isMultiple: boolean;
  deadline?: string;
  options: string[];
}

export const voteApi = {
  getVotes: async (projectId: number): Promise<Vote[]> => {
    const res = await apiClient.get(`/projects/${projectId}/votes`);
    return res.data;
  },

  createVote: async (projectId: number, data: CreateVoteData): Promise<Vote> => {
    const res = await apiClient.post(`/projects/${projectId}/votes`, data);
    return res.data;
  },

  castVote: async (projectId: number, voteId: number, optionIds: number[]): Promise<void> => {
    await apiClient.post(`/projects/${projectId}/votes/${voteId}/cast`, { optionIds });
  },

  deleteVote: async (projectId: number, voteId: number): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/votes/${voteId}`);
  }
};
