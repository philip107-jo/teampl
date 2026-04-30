import { prisma } from '../../prisma';
import { emitTaskUpdate } from '../../socket';

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
        const task = await prisma.task.create({
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
        emitTaskUpdate(projectId);
        return task;
    },

    batchCreate: async (email: string, projectId: number, tasks: any[]) => {
        await verifyMembership(email, projectId);
        const createdTasks = [];
        for (const taskData of tasks) {
            let priority = 'medium';
            if (taskData.priority && ['low', 'medium', 'high'].includes(taskData.priority.toLowerCase())) {
                priority = taskData.priority.toLowerCase();
            }
            
            const t = await (prisma as any).task.create({
                data: {
                    projectId,
                    title: taskData.title || '새 태스크',
                    status: 'TODO',
                    priority: priority,
                    deadline: taskData.deadline || '',
                    difficulty: parseInt(taskData.difficulty) || 3,
                    ownerEmail: email,
                    assignees: [], // AI 생성은 일단 미배정
                }
            });
            createdTasks.push(t);
        }
        emitTaskUpdate(projectId);
        return createdTasks;
    },

    updateStatus: async (email: string, projectId: number, taskId: string, status: string) => {
        await verifyMembership(email, projectId);
        const updated = await (prisma as any).task.update({
            where: { id: taskId },
            data: { 
                status: status as any,
                completedAt: status === 'DONE' ? new Date() : null
            }
        });
        emitTaskUpdate(projectId);
        return updated;
    },

    updateAssignees: async (email: string, projectId: number, taskId: string, assignees: string[]) => {
        await verifyMembership(email, projectId);
        const existingTask = await prisma.task.findUnique({ where: { id: taskId } });
        if (!existingTask) throw new Error("태스크를 찾을 수 없습니다.");

        // 남이 지정한 걸 뺏어가려고 하는 경우 원천 차단 (배열이 채워져 있고, 내가 그 배열에 원래 안 들어있었는데 남의 걸 덮어씌울 때)
        // 로직 단순화: 누군가 이미 1명 이상 배정되어 있고, 그게 취소가 아니라 새로운 사람 덮어쓰기라면 락
        if (existingTask.assignees.length > 0 && 
            !existingTask.assignees.includes(email) && 
            assignees.includes(email)
        ) {
            throw new Error("이미 다른 팀원이 배정받은 업무입니다.");
        }

        const updated = await prisma.task.update({
            where: { id: taskId },
            data: { assignees }
        });
        emitTaskUpdate(projectId);
        return updated;
    },

    delete: async (email: string, projectId: number, taskId: string) => {
        await verifyMembership(email, projectId);
        try {
            await prisma.task.delete({ where: { id: taskId } });
            emitTaskUpdate(projectId);
            return true;
        } catch {
            return false;
        }
    },

    deleteByProjectId: async (projectId: number) => {
        await prisma.task.deleteMany({ where: { projectId } });
    }
};
