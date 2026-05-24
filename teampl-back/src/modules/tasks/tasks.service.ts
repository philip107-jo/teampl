import { prisma } from '../../prisma';
import { emitTaskUpdate } from '../../socket';
import { NotificationsService } from '../notifications/notifications.service';
import { uploadToKTCloud, deleteFromKTCloud } from '../drive/ktcloud.storage';
import { verifyMembership } from '../projects/membership';

export const TasksService = {
    // 프로젝트 기준으로 모든 태스크 조회
    getByProject: async (email: string, projectId: number) => {
        await verifyMembership(email, projectId);
        return await prisma.task.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            include: { approvals: true, deliverables: true }
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
                requiresDeliverable: data.requiresDeliverable !== undefined ? data.requiresDeliverable : true,
            }
        });
        
        // 새 업무가 할당된 담당자들에게 알림 생성
        if (data.assignees && data.assignees.length > 0) {
            const promises = data.assignees
                .filter((assigneeEmail: string) => assigneeEmail !== email)
                .map((assigneeEmail: string) => NotificationsService.createNotification({
                    userEmail: assigneeEmail,
                    type: 'task',
                    title: '새로운 업무 할당',
                    content: `'${task.title}' 업무 담당자로 지정되었습니다.`
                }));
            await Promise.all(promises);
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
            
            const t = await prisma.task.create({
                data: {
                    projectId,
                    title: taskData.title || '새 태스크',
                    description: taskData.description || '',
                    status: 'TODO',
                    priority: priority as any,
                    deadline: taskData.deadline || '',
                    difficulty: parseInt(taskData.difficulty) || 3,
                    ownerEmail: email,
                    assignees: [], // AI 생성은 일단 미배정
                    requiresDeliverable: taskData.requiresDeliverable !== undefined ? taskData.requiresDeliverable : true,
                }
            });
            createdTasks.push(t);
        }
        emitTaskUpdate(projectId);
        return createdTasks;
    },

    submitForReview: async (email: string, projectId: number, taskId: string, files: Express.Multer.File[]) => {
        await verifyMembership(email, projectId);
        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) throw new Error("태스크를 찾을 수 없습니다.");
        if (files.length === 0) throw new Error("최소 1개 이상의 파일이 필요합니다.");
        
        
        // 파일 업로드 및 DB 기록
        for (const file of files) {
            const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
            const safeFileName = originalName.replace(/[^a-zA-Z0-9가-힣.\-_]/g, '_');
            const key = `projects/${projectId}/tasks/${taskId}/${Date.now()}_${safeFileName}`;
            const publicUrl = await uploadToKTCloud(key, file.buffer, file.mimetype);
            
            await prisma.taskDeliverable.create({
                data: {
                    taskId,
                    name: key,
                    originalName,
                    type: file.mimetype,
                    size: file.size,
                    url: publicUrl,
                    uploaderEmail: email
                }
            });
        }
        
        // 상태 업데이트
        await prisma.task.update({
            where: { id: taskId },
            data: { status: 'IN_REVIEW', submitterEmail: email }
        });
        
        emitTaskUpdate(projectId);
        return await prisma.task.findUnique({
            where: { id: taskId },
            include: { approvals: true, deliverables: true }
        });
    },

    addDeliverables: async (email: string, projectId: number, taskId: string, files: Express.Multer.File[]) => {
        await verifyMembership(email, projectId);
        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) throw new Error("태스크를 찾을 수 없습니다.");
        if (task.status !== 'IN_REVIEW') throw new Error("검토 중인 과제에만 파일을 추가할 수 있습니다.");
        if (task.submitterEmail !== email) throw new Error("제출자만 파일을 추가할 수 있습니다.");
        
        
        if (files && files.length > 0) {
            for (const file of files) {
                const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
                const safeFileName = originalName.replace(/[^a-zA-Z0-9가-힣.\-_]/g, '_');
                const key = `projects/${projectId}/tasks/${taskId}/${Date.now()}_${safeFileName}`;
                const publicUrl = await uploadToKTCloud(key, file.buffer, file.mimetype);
                
                await prisma.taskDeliverable.create({
                    data: {
                        taskId,
                        name: key,
                        originalName,
                        type: file.mimetype,
                        size: file.size,
                        url: publicUrl,
                        uploaderEmail: email
                    }
                });
            }
        }
        
        emitTaskUpdate(projectId);
        return await prisma.task.findUnique({
            where: { id: taskId },
            include: { approvals: true, deliverables: true }
        });
    },

    deleteDeliverable: async (email: string, projectId: number, taskId: string, deliverableId: number) => {
        await verifyMembership(email, projectId);
        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) throw new Error("태스크를 찾을 수 없습니다.");
        if (task.submitterEmail !== email) throw new Error("제출자만 파일을 삭제할 수 있습니다.");
        
        const deliverable = await prisma.taskDeliverable.findUnique({ where: { id: deliverableId } });
        if (!deliverable || deliverable.taskId !== taskId) throw new Error("파일을 찾을 수 없습니다.");
        
        
        try {
            await deleteFromKTCloud(deliverable.name); } catch {}
        
        await prisma.taskDeliverable.delete({ where: { id: deliverableId } });
        
        emitTaskUpdate(projectId);
        return { success: true };
    },

    approveTask: async (email: string, projectId: number, taskId: string) => {
        await verifyMembership(email, projectId);
        const task = await prisma.task.findUnique({ 
            where: { id: taskId },
            include: { approvals: true, deliverables: true } 
        });
        if (!task) throw new Error("태스크를 찾을 수 없습니다.");
        if (task.status !== 'IN_REVIEW') throw new Error("검토 중인 과제만 승인할 수 있습니다.");
        if (task.submitterEmail === email) throw new Error("본인이 제출한 산출물은 직접 승인할 수 없습니다.");
        if ((task.deliverables as any[]).length === 0) throw new Error("제출된 산출물이 없습니다.");
        
        const alreadyApproved = task.approvals.find(a => a.userEmail === email);
        if (alreadyApproved) throw new Error("이미 승인한 과제입니다.");
        
        await prisma.taskApproval.create({
            data: { taskId, userEmail: email }
        });
        
        const totalApprovals = task.approvals.length + 1;
        
        const memberCount = await prisma.projectMember.count({
            where: { projectId, status: 'ACTIVE' }
        });
        // 제외: 리더 또는 제출자 본인은 제외할 수 있지만 여기서는 전체 과반수로 심플하게 설정 (리더/제출자 포함)
        const requiredApprovals = Math.max(1, Math.ceil(memberCount / 2));
        
        if (totalApprovals >= requiredApprovals) {
            await prisma.task.update({
                where: { id: taskId },
                data: { status: 'DONE', completedAt: new Date() }
            });
            
            let folder = await prisma.driveFolder.findFirst({
                where: { projectId, name: '[자동 생성] 과제 산출물' }
            });
            if (!folder) {
                folder = await prisma.driveFolder.create({
                    data: { projectId, name: '[자동 생성] 과제 산출물', theme: 'purple' }
                });
            }
            
            // 모든 산출물 파일을 자료실에 등록
            for (const deliverable of task.deliverables as any[]) {
                await prisma.driveFile.create({
                    data: {
                        projectId,
                        folderId: folder.id,
                        name: deliverable.name,
                        originalName: `[${task.title}] ${deliverable.originalName}`,
                        type: deliverable.type,
                        size: deliverable.size,
                        url: deliverable.url,
                        uploaderEmail: task.submitterEmail!
                    }
                });
            }
            
            if (task.submitterEmail) {
                await NotificationsService.createNotification({
                    userEmail: task.submitterEmail,
                    type: 'task',
                    title: '과제 최종 승인 완료',
                    content: `'${task.title}' 과제가 팀원들의 승인을 받아 자료실에 자동 업로드 되었습니다.`
                });
            }
        }
        
        emitTaskUpdate(projectId);
        return await prisma.task.findUnique({ where: { id: taskId }, include: { approvals: true, deliverables: true } });
    },

    updateStatus: async (email: string, projectId: number, taskId: string, status: string) => {
        await verifyMembership(email, projectId);
        const task = await prisma.task.findUnique({ where: { id: taskId } });
        if (!task) throw new Error("태스크를 찾을 수 없습니다.");

        if (status === 'DONE' && (task as any).requiresDeliverable && task.status !== 'IN_REVIEW') {
            throw new Error("이 과제는 산출물 제출 및 팀원 승인이 필요합니다.");
        }

        const updated = await prisma.task.update({
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
        const promises = assignees
            .filter((assigneeEmail: string) => assigneeEmail !== email)
            .map((assigneeEmail: string) => NotificationsService.createNotification({
                userEmail: assigneeEmail,
                type: 'task',
                title: '업무 담당자 변경',
                content: `'${updated.title}' 업무 담당자로 지정되었습니다.`
            }));
        await Promise.all(promises);
        
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


    updateDetails: async (email: string, projectId: number, taskId: string, data: { description?: string; title?: string; requiresDeliverable?: boolean }) => {
        await verifyMembership(email, projectId);
        const updateData: any = {};
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.requiresDeliverable !== undefined) updateData.requiresDeliverable = data.requiresDeliverable;

        const updated = await prisma.task.update({
            where: { id: taskId },
            data: updateData
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
