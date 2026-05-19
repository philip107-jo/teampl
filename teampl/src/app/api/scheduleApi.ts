import { apiClient } from './client';

export interface Schedule {
  id: string | number;
  title: string;
  date: string;
  endDate?: string;
  type?: string;
  color?: string;
}

export const scheduleApi = {
  // --- Project Specific Schedules ---
  getSchedules: async (projectId: number): Promise<Schedule[]> => {
    const response = await apiClient.get(`/projects/${projectId}/schedules`);
    return response.data;
  },

  createSchedule: async (projectId: number, data: Partial<Schedule>): Promise<Schedule> => {
    const response = await apiClient.post(`/projects/${projectId}/schedules`, data);
    return response.data;
  },

  updateSchedule: async (projectId: number, id: string | number, data: Partial<Schedule>): Promise<Schedule> => {
    const response = await apiClient.patch(`/projects/${projectId}/schedules/${id}`, data);
    return response.data;
  },

  deleteSchedule: async (projectId: number, id: string | number): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/schedules/${id}`);
  },

  // --- Global Schedules ---
  getGlobalSchedules: async (): Promise<Schedule[]> => {
    const response = await apiClient.get(`/schedules`);
    return response.data;
  },

  createGlobalSchedule: async (data: Partial<Schedule> & { projectId?: string | number | null }): Promise<Schedule> => {
    const response = await apiClient.post(`/schedules`, data);
    return response.data;
  },

  updateGlobalSchedule: async (id: string | number, data: Partial<Schedule> & { projectId?: string | number | null }): Promise<Schedule> => {
    const response = await apiClient.patch(`/schedules/${id}`, data);
    return response.data;
  },

  deleteGlobalSchedule: async (id: string | number, projectId?: string | number | null): Promise<void> => {
    await apiClient.delete(`/schedules/${id}${projectId ? `?projectId=${projectId}` : ''}`);
  }
};
