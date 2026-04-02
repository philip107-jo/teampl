import { prisma } from '../../prisma';

async function verifyMembership(email: string, projectId: number) {
    const member = await prisma.projectMember.findUnique({
        where: {
            userEmail_projectId: { userEmail: email, projectId },
            status: 'ACTIVE'
        }
    });
    if (!member) {
        throw new Error('이 프로젝트에 접근 권한이 없습니다.');
    }
    return member;
}

export const SchedulesService = {
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
    }
};
