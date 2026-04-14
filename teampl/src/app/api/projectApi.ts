import { apiClient } from './client';

export interface Project {
    id: number;
    name: string;
    course: string;
    description: string;
    progress: number;
    createdAt?: string;
    deadline: string;
    members: number;
    color: string;
    iconColor: string;
    progressColor: string;
    icon: string;
    inviteCode?: string;
    userName?: string;
    creatorEmail?: string;
    membersList?: { id: number; email: string; name: string; role: string; avatarColor: string }[];
    userRole?: string;
    userStatus?: string;
    kickReason?: string;
}

export const projectApi = {
    getProjects: async (): Promise<Project[]> => {
        const response = await apiClient.get('/projects');
        return response.data;
    },

    createProject: async (projectData: Partial<Project>): Promise<Project> => {
        const response = await apiClient.post('/projects', projectData);
        return response.data;
    },

    updateProject: async (id: number, projectData: Partial<Project>): Promise<Project> => {
        const response = await apiClient.patch(`/projects/${id}`, projectData);
        return response.data;
    },

    deleteProject: async (id: number, deleteReason?: string): Promise<void> => {
        await apiClient.delete(`/projects/${id}`, { data: { deleteReason } });
    },

    joinProject: async (inviteCode: string, userName?: string): Promise<Project> => {
        const response = await apiClient.post('/projects/join', { inviteCode, userName });
        return response.data;
    },

    regenerateInviteCode: async (id: number): Promise<Project> => {
        const response = await apiClient.patch(`/projects/${id}/invite-code`);
        return response.data;
    },

    transferLeadership: async (id: number, targetUserId: string): Promise<void> => {
        const response = await apiClient.patch(`/projects/${id}/transfer-leadership`, { targetUserId });
        return response.data;
    },

    kickMember: async (id: number, targetUserId: string, kickReason: string): Promise<void> => {
        const response = await apiClient.patch(`/projects/${id}/kick-member`, { targetUserId, kickReason });
        return response.data;
    },

    getKickedAlerts: async (): Promise<{projectId: number, projectName: string, kickReason: string}[]> => {
        const response = await apiClient.get('/projects/kicked-alerts');
        return response.data;
    },

    ackKickedAlert: async (id: number): Promise<void> => {
        await apiClient.delete(`/projects/${id}/kicked-alert`);
    },

    getDeleteAlerts: async (): Promise<{id: number, projectName: string, deleteReason: string, createdAt: string}[]> => {
        const response = await apiClient.get('/projects/delete-alerts');
        return response.data;
    },

    ackDeleteAlert: async (alertId: number): Promise<void> => {
        await apiClient.delete(`/projects/${alertId}/delete-alert`);
    },

    getProjectStats: async (projectId: number): Promise<any[]> => {
        const response = await apiClient.get(`/projects/${projectId}/stats`);
        return response.data;
    }
};
