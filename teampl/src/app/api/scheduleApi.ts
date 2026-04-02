import { apiClient } from './client';

export interface Schedule {
  id: string | number;
  title: string;
  project?: string;
  date: string;       // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD
  type?: string;
  color?: string;
}

export const scheduleApi = {
  getSchedules: async (): Promise<Schedule[]> => {
    const response = await apiClient.get('/schedules');
    return response.data;
  },

  createSchedule: async (data: Partial<Schedule>): Promise<Schedule> => {
    const response = await apiClient.post('/schedules', data);
    return response.data;
  },

  updateSchedule: async (id: string | number, data: Partial<Schedule>): Promise<Schedule> => {
    const response = await apiClient.patch(`/schedules/${id}`, data);
    return response.data;
  },

  deleteSchedule: async (id: string | number): Promise<void> => {
    await apiClient.delete(`/schedules/${id}`);
  }
};
