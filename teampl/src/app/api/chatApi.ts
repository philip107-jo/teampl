import { apiClient as client } from './client';

export interface ChatMessage {
  id: number;
  projectId: number | null;
  senderEmail: string;
  receiverEmail: string | null;
  content: string;
  createdAt: string;
  sender?: { name: string, department: string | null };
}

export const chatApi = {
  getProjectMessages: async (projectId: number): Promise<ChatMessage[]> => {
    const response = await client.get(`/chat/project/${projectId}`);
    return response.data;
  },

  getDirectMessages: async (targetEmail: string): Promise<ChatMessage[]> => {
    const response = await client.get(`/chat/direct/${targetEmail}`);
    return response.data;
  },

  uploadFile: async (file: File): Promise<{ url: string; name: string; type: string; size: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await client.post('/chat/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
