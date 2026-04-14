import { apiClient } from './client';

export const authApi = {
    login: async (email: string, password?: string) => {
        const response = await apiClient.post('/auth/login', { email, password });
        return response.data; // { user, token }
    },
    register: async (data: {email: string, password: string, name: string}) => {
        const response = await apiClient.post('/auth/register', data);
        return response.data;
    },
    getProfile: async () => {
        const response = await apiClient.get('/users/me');
        return response.data;
    }
}
