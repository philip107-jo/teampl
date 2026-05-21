import { prisma } from '../../prisma';
import { emitTaskUpdate } from '../../socket';
import { NotificationsService } from '../notifications/notifications.service';

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
                description: data.description || '',
                status: data.status || 'TODO',
                priority: data.priority || 'medium',
                deadline: data.deadline || new Date().toISOString().split('T')[0],
                ownerEmail: email,
                assignees: data.assignees || [],
            }
        });
        
        // 새 업무가 할당된 담당자들에게 알림 생성
        if (data.assignees && data.assignees.length > 0) {
            for (const assigneeEmail of data.assignees) {
                if (assigneeEmail !== email) {
                    await NotificationsService.createNotification({
                        userEmail: assigneeEmail,
                        type: 'task',
                        title: '새로운 업무 할당',
                        content: `'${task.title}' 업무 담당자로 지정되었습니다.`
                    });
                }
            }
        }
        
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
                    description: taskData.description || '',
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

        // 새로 추가된 담당자에게 알림 발송
        for (const assigneeEmail of assignees) {
            if (assigneeEmail !== email) {
                await NotificationsService.createNotification({
                    userEmail: assigneeEmail,
                    type: 'task',
                    title: '업무 담당자 변경',
                    content: `'${updated.title}' 업무 담당자로 지정되었습니다.`
                });
            }
        }
        
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
    },

    updateDetails: async (email: string, projectId: number, taskId: string, data: { description?: string; title?: string }) => {
        await verifyMembership(email, projectId);
        const updated = await prisma.task.update({
            where: { id: taskId },
            data: {
                title: data.title,
                description: data.description,
            }
        });
        emitTaskUpdate(projectId);
        return updated;
    },

    getComments: async (email: string, projectId: number, taskId: string) => {
        await verifyMembership(email, projectId);
        return await prisma.taskComment.findMany({
            where: { taskId },
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'asc' }
        });
    },

    addComment: async (email: string, projectId: number, taskId: string, content: string) => {
        await verifyMembership(email, projectId);
        const comment = await prisma.taskComment.create({
            data: {
                taskId,
                userEmail: email,
                content
            },
            include: { user: { select: { name: true, email: true } } }
        });
        // We could emit a specific comment update, but task update suffices to trigger refresh
        emitTaskUpdate(projectId);
        return comment;
    },

    deleteComment: async (email: string, projectId: number, commentId: number) => {
        const comment = await prisma.taskComment.findUnique({ where: { id: commentId } });
        if (!comment) throw new Error("댓글을 찾을 수 없습니다.");
        if (comment.userEmail !== email) throw new Error("본인의 댓글만 삭제할 수 있습니다.");
        
        await verifyMembership(email, projectId);
        await prisma.taskComment.delete({ where: { id: commentId } });
        emitTaskUpdate(projectId);
        return true;
    }
};
