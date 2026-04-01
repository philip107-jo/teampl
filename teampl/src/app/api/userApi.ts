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
};
