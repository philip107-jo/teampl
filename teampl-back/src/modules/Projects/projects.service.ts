import { prisma } from '../../prisma';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface Project {
    id: number;
    name: string;
    course?: string;
    description?: string;
    progress: number;
    deadline: string;
    members: number;
    color?: string;
    iconColor?: string;
    progressColor?: string;
    icon?: string;
}

export const ProjectsService = {
    getAll: async (email: string) => {
        if (!email) return [];
        const memberships = await prisma.projectMember.findMany({
            where: { userEmail: email, status: 'ACTIVE' },
            include: { 
                project: {
                    include: {
                        projectMembers: {
                            where: { status: 'ACTIVE' },
                            include: { user: true }
                        }
                    }
                } 
            },
            orderBy: { project: { id: 'desc' } }
        });
        
        return memberships.map((m: any) => {
            const projectData: any = { ...m.project, userRole: m.role, userStatus: m.status, kickReason: m.kickReason };
            if (projectData.projectMembers) {
                projectData.membersList = projectData.projectMembers.map((pm: any) => ({
                    id: pm.user.id,
                    email: pm.user.email,
                    name: pm.user.name,
                    department: pm.user.department,
                    studentId: pm.user.studentId,
                    role: pm.role,
                    avatarColor: pm.role === 'LEADER' ? 'bg-[#7C6CFF]' : 'bg-[#27D7A1]'
                }));
                delete projectData.projectMembers;
            }
            return projectData;
        });
    },

    create: async (email: string, data: Partial<Project>) => {
        let formattedDeadline = data.deadline || "미정";
        if (formattedDeadline.indexOf('-') !== -1) {
            formattedDeadline = formattedDeadline.replace(/-/g, '.');
        }

        const generatedInviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        const newProject = await prisma.project.create({
            data: {
                name: data.name || '새 프로젝트',
                course: data.course || '기타',
                description: data.description || '',
                progress: typeof data.progress === 'number' ? data.progress : 0,
                deadline: formattedDeadline,
                members: typeof data.members === 'number' ? data.members : 1,
                color: data.color || "bg-[#f1f5f9]",
                icon: data.icon || "Target",
                inviteCode: generatedInviteCode,
            }
        });

        if (email) {
            await prisma.projectMember.create({
                data: {
                    userEmail: email,
                    projectId: newProject.id,
                    role: 'LEADER'
                }
            });
        }

        return newProject;
    },

    update: async (email: string, id: number, data: Partial<Project>) => {
        const member = await prisma.projectMember.findUnique({
            where: { userEmail_projectId: { userEmail: email, projectId: Number(id) } }
        });
        if (!member || member.role !== 'LEADER') {
            throw new Error('프로젝트 수정 권한이 없습니다.');
        }

        let formattedDeadline = data.deadline;
        if (formattedDeadline && formattedDeadline.indexOf('-') !== -1) {
            formattedDeadline = formattedDeadline.replace(/-/g, '.');
        }

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.course !== undefined) updateData.course = data.course;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.progress !== undefined) updateData.progress = data.progress;
        if (formattedDeadline !== undefined) updateData.deadline = formattedDeadline;
        if (data.members !== undefined) updateData.members = data.members;
        if (data.color !== undefined) updateData.color = data.color;
        if (data.icon !== undefined) updateData.icon = data.icon;

        return await prisma.project.update({
            where: { id: Number(id) },
            data: updateData
        });
    },

    delete: async (email: string, id: number, deleteReason?: string) => {
        try {
            const member = await prisma.projectMember.findUnique({
                where: { userEmail_projectId: { userEmail: email, projectId: Number(id) } }
            });
            if (!member || member.role !== 'LEADER') {
                return false;
            }

            // 삭제 전 모든 활성 팀원 목록 조회
            const allMembers = await prisma.projectMember.findMany({
                where: { projectId: Number(id), status: 'ACTIVE', userEmail: { not: email } }
            });

            // 프로젝트 이름 조회
            const project = await prisma.project.findUnique({ where: { id: Number(id) } });
            const projectName = project?.name || '알 수 없는 프로젝트';
            const reason = deleteReason || '팀장이 프로젝트를 종료했습니다.';

            // 각 팀원에게 삭제 알림 생성
            if (allMembers.length > 0) {
                await prisma.projectDeleteAlert.createMany({
                    data: allMembers.map((m: any) => ({
                        userEmail: m.userEmail,
                        projectName,
                        deleteReason: reason,
                    }))
                });
            }

            await prisma.project.delete({ where: { id: Number(id) } });
            return true;
        } catch (e) {
            return false;
        }
    },

    join: async (email: string, inviteCode: string, userName: string) => {
        const project = await prisma.project.findUnique({
            where: { inviteCode }
        });
        
        if (project) {
            // 이미 가입했는지 확인
            const existing = await prisma.projectMember.findUnique({
                where: { userEmail_projectId: { userEmail: email, projectId: project.id } }
            });
            
            if (!existing) {
                await prisma.projectMember.create({
                    data: {
                        userEmail: email,
                        projectId: project.id,
                        role: 'MEMBER'
                    }
                });
                return await prisma.project.update({
                    where: { id: project.id },
                    data: { members: project.members + 1 }
                });
            }
            return project; // 이미 가입된 경우 기존 정보 반환
        }
        return null;
    },

    regenerateInviteCode: async (email: string, projectId: number) => {
        const member = await prisma.projectMember.findUnique({
            where: { userEmail_projectId: { userEmail: email, projectId } }
        });
        if (!member || member.role !== 'LEADER') throw new Error('권한이 없습니다.');

        const newInviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        return await prisma.project.update({
            where: { id: projectId },
            data: { inviteCode: newInviteCode }
        });
    },

    transferLeadership: async (email: string, projectId: number, targetUserId: string) => {
        const me = await prisma.projectMember.findUnique({
            where: { userEmail_projectId: { userEmail: email, projectId } }
        });
        if (!me || me.role !== 'LEADER') throw new Error('권한이 없습니다.');

        const targetMember = await prisma.projectMember.findFirst({
            where: { projectId, user: { id: targetUserId } }
        });
        if (!targetMember) throw new Error('대상 유저를 찾을 수 없습니다.');

        return await prisma.$transaction([
            prisma.projectMember.update({
                where: { id: targetMember.id },
                data: { role: 'LEADER' }
            }),
            prisma.projectMember.update({
                where: { id: me.id },
                data: { role: 'MEMBER' }
            })
        ]);
    },

    kickMember: async (email: string, projectId: number, targetUserId: string, kickReason: string) => {
        const me = await prisma.projectMember.findUnique({
            where: { userEmail_projectId: { userEmail: email, projectId } }
        });
        if (!me || me.role !== 'LEADER') throw new Error('권한이 없습니다.');

        const targetMember = await prisma.projectMember.findFirst({
            where: { projectId, user: { id: targetUserId } }
        });
        if (!targetMember) throw new Error('대상 유저를 찾을 수 없습니다.');

        return await prisma.$transaction([
            prisma.projectMember.update({
                where: { id: targetMember.id },
                data: { status: 'KICKED', kickReason }
            }),
            prisma.project.update({
                where: { id: projectId },
                data: { members: { decrement: 1 } }
            })
        ]);
    },

    getKickedAlerts: async (email: string) => {
        if (!email) return [];
        const alerts = await prisma.projectMember.findMany({
            where: { userEmail: email, status: 'KICKED' },
            include: { project: { select: { name: true } } }
        });
        return alerts.map((a: any) => ({
            projectId: a.projectId,
            projectName: a.project.name,
            kickReason: a.kickReason || '알 수 없는 사유'
        }));
    },

    ackKickedAlert: async (email: string, projectId: number) => {
        return await prisma.projectMember.delete({
            where: { userEmail_projectId: { userEmail: email, projectId } }
        });
    },

    getDeleteAlerts: async (email: string) => {
        if (!email) return [];
        return await prisma.projectDeleteAlert.findMany({
            where: { userEmail: email },
            orderBy: { createdAt: 'desc' }
        });
    },

    ackDeleteAlert: async (email: string, alertId: number) => {
        return await prisma.projectDeleteAlert.deleteMany({
            where: { id: alertId, userEmail: email }
        });
    },

    getStats: async (projectId: number) => {
        const members = await prisma.projectMember.findMany({
            where: { projectId, status: 'ACTIVE' },
            include: { user: true }
        });
        
        const tasks = await (prisma as any).task.findMany({ where: { projectId } });
        const docs = await (prisma as any).sharedDocument.findMany({ where: { projectId } });

        const stats = members.map(m => {
            const memberEmail = m.userEmail;
            const memberTasks = tasks.filter((t: any) => t.assignees.includes(memberEmail));
            
            let totalPotential = 0;
            let totalEarned = 0;
            let completedCount = 0;

            memberTasks.forEach((task: any) => {
                const priorityWeight = task.priority === 'high' ? 1.5 : task.priority === 'medium' ? 1.0 : 0.8;
                const basePoints = (task.difficulty || 3) * priorityWeight;
                totalPotential += basePoints * 1.2;

                if (task.status === 'DONE') {
                    completedCount++;
                    let timeFactor = 1.0;
                    if (task.completedAt && task.deadline) {
                        const completedDate = new Date(task.completedAt).toISOString().split('T')[0];
                        const deadlineDate = task.deadline.replace(/\./g, '-');
                        if (completedDate <= deadlineDate) timeFactor = 1.2;
                        else timeFactor = 0.7;
                    }
                    totalEarned += basePoints * timeFactor;
                }
            });

            // 문서 작성 가산점 (작성한 문서당 5점)
            const createdDocs = docs.filter((d: any) => d.creatorEmail === memberEmail);
            totalPotential += createdDocs.length * 5;
            totalEarned += createdDocs.length * 5;

            // 임시 소통 점수
            const chatCount = 5; // 나중에 실제 채팅 모델 연결시 연동
            totalEarned += chatCount * 2;
            totalPotential += 10;

            const score = totalPotential > 0 ? Math.min(100, Math.round((totalEarned / totalPotential) * 100)) : 0;
            
            return {
                email: memberEmail,
                score,
                completed: completedCount,
                total: memberTasks.length,
                chatCount
            };
        });

        return stats;
    },

    generateTasksWithAi: async (prompt: string) => {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        const systemPrompt = `
You are a technical project manager assistant. Your job is to break down the user's project description into small, actionable tasks.
For each task, assign:
- "title": a clear, concise task name IN KOREAN (한국어).
- "priority": one of "low", "medium", "high".
- "deadline": an empty string "".
- "difficulty": an integer between 1 and 5, representing complexity (1=easy, 5=hard).

You must respond ONLY with a valid JSON array of objects. Never include markdown formatting like \`\`\`json. Example:
[
  { "title": "깃허브 레포지토리 환경 세팅", "priority": "high", "deadline": "", "difficulty": 2 },
  { "title": "데이터베이스 스키마 설계 및 구축", "priority": "high", "deadline": "", "difficulty": 4 }
]
`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
        });

        const content = response.choices[0]?.message?.content || "[]";
        try {
            // Some robust parsing in case GPT returns markdown blocks
            const jsonStr = content.replace(/```json/g, "").replace(/```/g, "").trim();
            const tasks = JSON.parse(jsonStr);
            return tasks;
        } catch (e) {
            console.error("Failed to parse AI output:", content);
            throw new Error("AI 응답을 파싱하는 중 오류가 발생했습니다.");
        }
    }
};
