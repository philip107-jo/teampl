import { apiClient } from './client';

export interface UpdateProfilePayload {
  name?: string;
  studentId?: string;
  department?: string;
}

export const userApi = {
  getMe: async () => {
    const res = await apiClient.get('/users/me');
    return res.data;
  },
  updateProfile: async (payload: UpdateProfilePayload) => {
    const res = await apiClient.put('/users/me', payload);
    return res.data;
  },
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  upgradePlan: async () => {
    const res = await apiClient.post('/users/upgrade');
    return res.data;
  },
};
