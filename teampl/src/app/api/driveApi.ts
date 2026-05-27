import { apiClient as client } from './client';

export interface DriveFolder {
  id: number;
  projectId: number;
  name: string;
  theme: string;
  createdAt: string;
  creatorEmail?: string;
  creator?: { name: string };
  parentFolderId?: number | null;
}

export interface DriveFile {
  id: number;
  projectId: number;
  folderId: number | null;
  name: string;
  originalName: string;
  type: string;
  size: number;
  url: string;
  uploaderEmail: string;
  createdAt: string;
  uploader?: { name: string };
}

export const driveApi = {
  getDriveContents: async (projectId: number): Promise<{ folders: DriveFolder[], files: DriveFile[] }> => {
    const response = await client.get(`/projects/${projectId}/drive`);
    return response.data;
  },

  createFolder: async (projectId: number, name: string, parentFolderId?: number | null): Promise<DriveFolder> => {
    const response = await client.post(`/projects/${projectId}/drive/folders`, { name, parentFolderId });
    return response.data;
  },

  updateFolder: async (projectId: number, folderId: number, name: string): Promise<DriveFolder> => {
    const response = await client.patch(`/projects/${projectId}/drive/folders/${folderId}`, { name });
    return response.data;
  },

  uploadFile: async (projectId: number, file: File, folderId?: number): Promise<DriveFile> => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId.toString());

    const response = await client.post(`/projects/${projectId}/drive/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteFile: async (projectId: number, fileId: number): Promise<void> => {
    await client.delete(`/projects/${projectId}/drive/files/${fileId}`);
  },

  deleteFolder: async (projectId: number, folderId: number): Promise<void> => {
    await client.delete(`/projects/${projectId}/drive/folders/${folderId}`);
  },

  moveFile: async (projectId: number, fileId: number, folderId: number | null): Promise<DriveFile> => {
    const response = await client.patch(`/projects/${projectId}/drive/files/${fileId}/move`, { folderId });
    return response.data;
  },

  downloadZip: async (projectId: number, fileIds: number[]): Promise<Blob> => {
    const response = await client.post(`/projects/${projectId}/drive/download-zip`, { fileIds }, {
      responseType: 'blob'
    });
    return response.data;
  },

  downloadFile: async (projectId: number, fileId: number): Promise<Blob> => {
    const response = await client.get(`/projects/${projectId}/drive/files/${fileId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
