import { prisma } from '../../prisma';

export interface Schedule {
  id: number;
  title: string;
  project: string;
  date: string;
  endDate?: string;
  type: string;
  color: string;
  dot: string;
  ownerEmail?: string;
}

export const SchedulesService = {
  getAll: async (email: string) => {
    if (!email) return [];
    return await prisma.schedule.findMany({
        where: { ownerEmail: email },
        orderBy: { id: 'asc' }
    });
  },

  create: async (email: string, data: Partial<Schedule>) => {
    let color = "bg-gray-500";
    if (data.type === 'deadline') color = "bg-red-500";
    if (data.type === 'meeting') color = "bg-blue-500";
    if (data.type === 'presentation') color = "bg-purple-500";
    if (data.type === 'milestone') color = "bg-green-500";

    return await prisma.schedule.create({
      data: {
        title: data.title || '새 일정',
        project: data.project || '개인 일정',
        date: data.date || new Date().toISOString().split('T')[0],
        endDate: data.endDate || data.date || new Date().toISOString().split('T')[0],
        type: data.type || 'other',
        color: data.color || color,
        dot: data.dot || color,
        ownerEmail: email || 'unknown'
      }
    });
  },

  update: async (email: string, id: number, data: Partial<Schedule>) => {
    let color = data.color;
    let dot = data.dot;
    if (data.type && !color) {
      if (data.type === 'deadline') color = "bg-red-500";
      else if (data.type === 'meeting') color = "bg-blue-500";
      else if (data.type === 'presentation') color = "bg-purple-500";
      else if (data.type === 'milestone') color = "bg-green-500";
      else color = "bg-gray-500";
      dot = color;
    }

    const updateData: any = { ...data };
    delete updateData.id;
    if (color) { updateData.color = color; updateData.dot = dot || color; }
    
    // endDate fallback
    if (data.date && !data.endDate) {
      updateData.endDate = data.date;
    }

    return await prisma.schedule.update({
        where: { id: Number(id) },
        data: updateData
    });
  },

  delete: async (email: string, id: number) => {
    try {
        await prisma.schedule.delete({ where: { id: Number(id) } });
        return true;
    } catch(e) {
        return false;
    }
  }
};
