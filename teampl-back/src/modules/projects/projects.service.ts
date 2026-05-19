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

    inviteByEmail: async (email: string, projectId: number, targetEmail: string) => {
        // 1. 요청한 사람이 방장인지 확인
        const me = await prisma.projectMember.findUnique({
            where: { userEmail_projectId: { userEmail: email, projectId } }
        });
        if (!me || me.role !== 'LEADER') throw new Error('팀원 초대 권한이 없습니다.');

        // 2. 타겟 이메일을 가진 유저가 존재하는지 확인
        const targetUser = await prisma.user.findUnique({
            where: { email: targetEmail }
        });
        if (!targetUser) throw new Error('가입되지 않은 회원입니다.');

        // 3. 이미 해당 프로젝트에 가입되어 있는지 확인
        const existing = await prisma.projectMember.findUnique({
            where: { userEmail_projectId: { userEmail: targetEmail, projectId } }
        });
        
        if (existing) {
            if (existing.status === 'ACTIVE') {
                throw new Error('이미 프로젝트에 참여 중인 회원입니다.');
            } else {
                // KICKED 또는 LEFT 상태인 경우 다시 가입 처리
                await prisma.projectMember.update({
                    where: { id: existing.id },
                    data: { status: 'ACTIVE', role: 'MEMBER', kickReason: null }
                });
                return await prisma.project.update({
                    where: { id: projectId },
                    data: { members: { increment: 1 } }
                });
            }
        }

        // 4. 새로운 멤버 추가
        await prisma.projectMember.create({
            data: {
                userEmail: targetEmail,
                projectId,
                role: 'MEMBER',
                status: 'ACTIVE'
            }
        });

        return await prisma.project.update({
            where: { id: projectId },
            data: { members: { increment: 1 } }
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
        const messages = await (prisma as any).message.findMany({ where: { projectId } });

        const rawStats = members.map(m => {
            const memberEmail = m.userEmail;
            const memberTasks = tasks.filter((t: any) => t.assignees.includes(memberEmail));
            
            let earnedPoints = 0;
            let completedCount = 0;

            memberTasks.forEach((task: any) => {
                if (task.status === 'DONE') {
                    completedCount++;
                    const priorityWeight = task.priority === 'high' ? 1.5 : task.priority === 'medium' ? 1.0 : 0.8;
                    const basePoints = (task.difficulty || 3) * priorityWeight;
                    
                    let timeFactor = 1.0;
                    if (task.completedAt && task.deadline) {
                        const completedDate = new Date(task.completedAt).toISOString().split('T')[0];
                        const deadlineDate = task.deadline.replace(/\./g, '-');
                        if (completedDate <= deadlineDate) timeFactor = 1.2;
                        else timeFactor = 0.7;
                    }
                    // 성공한 태스크에 대해 가중치 점수 부여 (기본 10배수 스케일링)
                    earnedPoints += (basePoints * timeFactor) * 10;
                }
            });

            // 문서 작성 가산점 (문서당 15점)
            const createdDocs = docs.filter((d: any) => d.creatorEmail === memberEmail);
            earnedPoints += createdDocs.length * 15;

            // 실제 소통(채팅) 가산점 (메시지당 2점)
            const memberMessages = messages.filter((msg: any) => msg.senderEmail === memberEmail);
            earnedPoints += memberMessages.length * 2;

            return {
                email: memberEmail,
                earnedPoints,
                completed: completedCount,
                total: memberTasks.length,
                chatCount: memberMessages.length
            };
        });

        // 2단계: 전체 팀의 종합 점수를 기준으로 상대적 기여도(%) 계산
        const teamTotalPoints = rawStats.reduce((sum, s) => sum + s.earnedPoints, 0);

        const stats = rawStats.map(s => {
            // 아무도 활동이 없으면 모두 0%
            const score = teamTotalPoints > 0 ? Math.round((s.earnedPoints / teamTotalPoints) * 100) : 0;
            return {
                email: s.email,
                score,
                completed: s.completed,
                total: s.total,
                chatCount: s.chatCount
            };
        });

        return stats;
    },

    generateTasksWithAi: async (teamSize: number, topic: string, description: string) => {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OpenAI API key is not configured.");
        }
        
        const systemPrompt = `
You are an expert project manager assistant. Your job is to break down the user's project into HIGH-LEVEL, essential milestones.
DO NOT create overly detailed or numerous micro-tasks.

Project Details:
- Team Size: ${teamSize} members
- Topic/Type: ${topic}

Instructions:
1. Create roughly 1 to 3 core tasks per team member. For a team of ${teamSize}, generate around ${Math.max(3, teamSize * 1)} to ${teamSize * 3} tasks in total.
2. The tasks should be major milestones or roles (e.g., "자료조사 및 개요 작성", "메인 화면 UI 구현", "발표 스크립트 작성").
3. For each task, assign:
- "id": a unique short random string (e.g., "sk-123").
- "title": a clear, concise task name IN KOREAN (한국어).
- "priority": one of "low", "medium", "high".
- "deadline": an empty string "".
- "difficulty": an integer between 1 and 5 (1=easy, 5=hard).

You must respond ONLY with a valid JSON array of objects. Never include markdown formatting like \`\`\`json. Example:
[
  { "id": "t-1", "title": "주제 관련 문헌 자료 조사 및 요약", "priority": "high", "deadline": "", "difficulty": 3 },
  { "id": "t-2", "title": "PPT 템플릿 디자인 및 레이아웃 초안 제작", "priority": "medium", "deadline": "", "difficulty": 2 }
]
`;

        const userPrompt = description ? `세부 요구사항: ${description}` : `제시된 팀 규모와 주제에 맞게 핵심 업무를 분배해 주세요.`;

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
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
