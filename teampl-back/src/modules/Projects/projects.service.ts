import { prisma } from '../../prisma';

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
            where: { userEmail: email },
            include: { 
                project: {
                    include: {
                        projectMembers: {
                            include: { user: true }
                        }
                    }
                } 
            },
            orderBy: { project: { id: 'desc' } }
        });
        
        return memberships.map((m: any) => {
            const projectData: any = { ...m.project, userRole: m.role };
            if (projectData.projectMembers) {
                projectData.membersList = projectData.projectMembers.map((pm: any) => ({
                    id: pm.user.id,
                    email: pm.user.email,
                    name: pm.user.name,
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

    delete: async (email: string, id: number) => {
        try {
            const member = await prisma.projectMember.findUnique({
                where: { userEmail_projectId: { userEmail: email, projectId: Number(id) } }
            });
            if (!member || member.role !== 'LEADER') {
                return false;
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
    }
};
