import { apiClient } from './client';

export interface Notification {
  id: number;
  userEmail: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export const notificationApi = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await apiClient.get('/notifications');
    return response.data;
  },

  markAsRead: async (id: number): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
  },

  getVapidPublicKey: async (): Promise<string> => {
    const response = await apiClient.get('/notifications/vapid-public-key');
    return response.data.publicKey;
  },

  subscribePush: async (subscription: PushSubscription): Promise<void> => {
    await apiClient.post('/notifications/subscribe', subscription);
  },

  unsubscribePush: async (endpoint: string): Promise<void> => {
    await apiClient.delete('/notifications/unsubscribe', { data: { endpoint } });
  }
};
