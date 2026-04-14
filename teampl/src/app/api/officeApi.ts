import { apiClient as client } from './client';

export interface SharedDocument {
    id: number;
    projectId: number;
    fileName: string;
    fileType: string;
    webUrl: string;
    creatorEmail: string;
    createdAt: string;
}

export const officeApi = {
    getSharedDocuments: async (projectId: number): Promise<SharedDocument[]> => {
        const response = await client.get(`/projects/${projectId}/ms-docs`);
        return response.data;
    },
    
    createSharedDocument: async (projectId: number, type: string, title?: string): Promise<{ success: boolean; webUrl: string; document: SharedDocument }> => {
        const response = await client.post(`/projects/${projectId}/ms-docs`, { type, title });
        return response.data;
    }
};
