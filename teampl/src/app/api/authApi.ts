import { apiClient } from './client';

export const authApi = {
    login: async (email: string, password?: string) => {
        const response = await apiClient.post('/auth/login', { email, password });
        return response.data; // { user, token }
    },
    register: async (data: {email: string, password: string, name: string, studentId?: string, department?: string}) => {
        const response = await apiClient.post('/auth/register', data);
        return response.data;
    },
    sendVerificationCode: async (email: string) => {
        const response = await apiClient.post('/auth/send-code', { email });
        return response.data;
    },
    verifyCode: async (email: string, code: string) => {
        const response = await apiClient.post('/auth/verify-code', { email, code });
        return response.data;
    },
    getProfile: async () => {
        const response = await apiClient.get('/users/me');
        return response.data;
    },
    changePassword: async (currentPassword: string, newPassword: string) => {
        const response = await apiClient.post('/auth/change-password', { currentPassword, newPassword });
        return response.data;
    },
    sendForgotPasswordCode: async (email: string) => {
        const response = await apiClient.post('/auth/forgot-password/send-code', { email });
        return response.data;
    },
    verifyForgotPasswordCode: async (email: string, code: string) => {
        const response = await apiClient.post('/auth/forgot-password/verify-code', { email, code });
        return response.data;
    },
    resetPassword: async (email: string, newPassword: string) => {
        const response = await apiClient.post('/auth/forgot-password/reset', { email, newPassword });
        return response.data;
    }
}
