import { apiClient as client } from './client';

export interface ChatMessage {
  id: number;
  projectId: number | null;
  senderEmail: string;
  receiverEmail: string | null;
  content: string;
  isPinned?: boolean;
  createdAt: string;
  sender?: { name: string, department: string | null };
}

export interface ChatReadState {
  roomKey: string;
  lastReadMsgId: number;
  userEmail?: string;
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

  pinMessage: async (messageId: number, isPinned: boolean, roomKey?: string) => {
    const response = await client.post(`/chat/messages/${messageId}/pin`, { isPinned, roomKey });
    return response.data;
  },

  getReadStates: async (): Promise<ChatReadState[]> => {
    const response = await client.get('/chat/reads');
    return response.data;
  },

  getRoomReadStates: async (roomKey: string): Promise<ChatReadState[]> => {
    const response = await client.get(`/chat/reads/room/${roomKey}`);
    return response.data;
  },

  updateLastRead: async (roomKey: string, lastReadMsgId: number): Promise<void> => {
    await client.post('/chat/reads', { roomKey, lastReadMsgId });
  }
};
