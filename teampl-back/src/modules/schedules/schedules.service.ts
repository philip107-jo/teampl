import { prisma } from '../../prisma';

import { verifyMembership } from '../projects/membership';

export const SchedulesService = {
    // --- Project Specific Schedules ---
    getByProject: async (email: string, projectId: number) => {
        await verifyMembership(email, projectId);
        return await prisma.schedule.findMany({
            where: { projectId },
            orderBy: { id: 'asc' }
        });
    },

    create: async (email: string, projectId: number, data: any) => {
        await verifyMembership(email, projectId);

        let color = "bg-gray-500";
        if (data.type === 'deadline') color = "bg-red-500";
        if (data.type === 'meeting') color = "bg-blue-500";
        if (data.type === 'presentation') color = "bg-purple-500";
        if (data.type === 'milestone') color = "bg-green-500";

        return await prisma.schedule.create({
            data: {
                projectId,
                title: data.title || '새 일정',
                date: data.date || new Date().toISOString().split('T')[0],
                endDate: data.endDate || data.date || new Date().toISOString().split('T')[0],
                type: data.type || 'other',
                color: data.color || color,
                dot: data.dot || color,
                ownerEmail: email
            }
        });
    },

    update: async (email: string, projectId: number, id: number, data: any) => {
        await verifyMembership(email, projectId);

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
        delete updateData.projectId;
        if (color) { updateData.color = color; updateData.dot = dot || color; }
        if (data.date && !data.endDate) {
            updateData.endDate = data.date;
        }

        return await prisma.schedule.update({
            where: { id: Number(id) },
            data: updateData
        });
    },

    delete: async (email: string, projectId: number, id: number) => {
        await verifyMembership(email, projectId);
        try {
            await prisma.schedule.delete({ where: { id: Number(id) } });
            return true;
        } catch {
            return false;
        }
    },

    // --- Global Schedules (Personal + All Projects) ---
    getGlobal: async (email: string) => {
        // 1. Get all projects the user is an ACTIVE member of
        const members = await prisma.projectMember.findMany({
            where: { userEmail: email, status: 'ACTIVE' },
            select: { projectId: true }
        });
        const projectIds = members.map((m: any) => m.projectId);

        // 2. Get schedules for those projects OR personal schedules (projectId = null and ownerEmail = email)
        return await prisma.schedule.findMany({
            where: {
                OR: [
                    { projectId: { in: projectIds } },
                    { projectId: null, ownerEmail: email }
                ]
            },
            orderBy: { id: 'asc' },
            include: {
                project: { select: { name: true } }
            }
        });
    },

    createPersonal: async (email: string, data: any) => {
        let color = "bg-gray-500";
        if (data.type === 'deadline') color = "bg-red-500";
        if (data.type === 'meeting') color = "bg-blue-500";
        if (data.type === 'presentation') color = "bg-purple-500";
        if (data.type === 'milestone') color = "bg-green-500";

        return await prisma.schedule.create({
            data: {
                title: data.title || '새 개인 일정',
                date: data.date || new Date().toISOString().split('T')[0],
                endDate: data.endDate || data.date || new Date().toISOString().split('T')[0],
                type: data.type || 'other',
                color: data.color || color,
                dot: data.dot || color,
                ownerEmail: email,
                projectId: null
            }
        });
    },

    updatePersonal: async (email: string, id: number, data: any) => {
        // Verify ownership
        const schedule = await prisma.schedule.findUnique({ where: { id: Number(id) } });
        if (!schedule || schedule.projectId !== null || schedule.ownerEmail !== email) {
            throw new Error('수정 권한이 없는 일정이거나 개인 일정이 아닙니다.');
        }

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
        delete updateData.projectId;
        if (color) { updateData.color = color; updateData.dot = dot || color; }
        if (data.date && !data.endDate) {
            updateData.endDate = data.date;
        }

        return await prisma.schedule.update({
            where: { id: Number(id) },
            data: updateData
        });
    },

    deletePersonal: async (email: string, id: number) => {
        const schedule = await prisma.schedule.findUnique({ where: { id: Number(id) } });
        if (!schedule || schedule.projectId !== null || schedule.ownerEmail !== email) {
            throw new Error('삭제 권한이 없는 일정이거나 개인 일정이 아닙니다.');
        }
        
        try {
            await prisma.schedule.delete({ where: { id: Number(id) } });
            return true;
        } catch {
            return false;
        }
    }
};
