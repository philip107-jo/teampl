import { prisma } from '../../prisma';

// 해당 프로젝트의 멤버인지 확인하는 헬퍼
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

export const TasksService = {
    // 프로젝트 기준으로 모든 태스크 조회
    getByProject: async (email: string, projectId: number) => {
        await verifyMembership(email, projectId);
        return await prisma.task.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' }
        });
    },

    create: async (email: string, projectId: number, data: any) => {
        await verifyMembership(email, projectId);
        return await prisma.task.create({
            data: {
                projectId,
                title: data.title || '새 태스크',
                status: data.status || 'TODO',
                priority: data.priority || 'medium',
                deadline: data.deadline || new Date().toISOString().split('T')[0],
                ownerEmail: email,
                assignees: data.assignees || [],
            }
        });
    },

    batchCreate: async (email: string, projectId: number, tasks: any[]) => {
        await verifyMembership(email, projectId);
        const createdTasks = [];
        for (const taskData of tasks) {
            const t = await prisma.task.create({
                data: {
                    projectId,
                    title: taskData.title || '새 태스크',
                    status: 'TODO',
                    priority: taskData.priority || 'medium',
                    deadline: taskData.deadline || new Date().toISOString().split('T')[0],
                    ownerEmail: email,
                    assignees: [], // AI 생성은 일단 미배정
                }
            });
            createdTasks.push(t);
        }
        return createdTasks;
    },

    updateStatus: async (email: string, projectId: number, taskId: string, status: string) => {
        await verifyMembership(email, projectId);
        return await (prisma as any).task.update({
            where: { id: taskId },
            data: { 
                status: status as any,
                completedAt: status === 'DONE' ? new Date() : null
            }
        });
    },

    updateAssignees: async (email: string, projectId: number, taskId: string, assignees: string[]) => {
        await verifyMembership(email, projectId);
        return await prisma.task.update({
            where: { id: taskId },
            data: { assignees }
        });
    },

    delete: async (email: string, projectId: number, taskId: string) => {
        await verifyMembership(email, projectId);
        try {
            await prisma.task.delete({ where: { id: taskId } });
            return true;
        } catch {
            return false;
        }
    },

    deleteByProjectId: async (projectId: number) => {
        await prisma.task.deleteMany({ where: { projectId } });
    }
};
