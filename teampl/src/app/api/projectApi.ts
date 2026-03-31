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
    membersList?: { id: number; name: string; avatarColor: string }[];
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

    deleteProject: async (id: number): Promise<void> => {
        await apiClient.delete(`/projects/${id}`);
    },

    joinProject: async (inviteCode: string, userName?: string): Promise<Project> => {
        const response = await apiClient.post('/projects/join', { inviteCode, userName });
        return response.data;
    }
};
