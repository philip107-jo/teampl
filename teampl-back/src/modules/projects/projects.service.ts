// 이 파일은 프론트엔드 모의 데이터와 일치하는 임시 저장소와 서비스 로직입니다.
export interface Project {
    id: number;
    name: string;
    course: string;
    description: string;
    progress: number;
    deadline: string;
    members: number;
    createdAt?: string;
    color: string;
    iconColor: string;
    progressColor: string;
    icon: string; // lucide-react의 아이콘 이름을 문자열로 저장하여 프론트에서 매핑
}

let mockProjects: Project[] = [
    {
        id: 1,
        name: "데이터베이스 설계 프로젝트",
        course: "데이터베이스",
        description: "학생 관리 시스템 데이터베이스 설계 및 구현",
        progress: 75,
        deadline: "2026.03.20",
        members: 4,
        color: "bg-[#ebf5ff]",
        iconColor: "text-[#2563eb]",
        progressColor: "bg-[#2563eb]",
        icon: "Database",
    },
    {
        id: 2,
        name: "모바일 앱 개발",
        course: "소프트웨어공학",
        description: "캠퍼스 내 식당 예약 모바일 애플리케이션",
        progress: 45,
        deadline: "2026.03.25",
        members: 5,
        color: "bg-[#e7f9f2]",
        iconColor: "text-[#10b981]",
        progressColor: "bg-[#10b981]",
        icon: "Zap",
    },
    {
        id: 3,
        name: "AI 모델 구현",
        course: "인공지능",
        description: "이미지 분류를 위한 CNN 모델 구현 및 학습",
        progress: 30,
        deadline: "2026.04.01",
        members: 3,
        color: "bg-[#f3f0ff]",
        iconColor: "text-[#8b5cf6]",
        progressColor: "bg-[#8b5cf6]",
        icon: "BarChart3",
    },
    {
        id: 4,
        name: "웹 서비스 기획",
        course: "창업과 경영",
        description: "대학생을 위한 스터디 매칭 플랫폼 기획",
        progress: 90,
        deadline: "2026.04.15",
        members: 3,
        color: "bg-[#fff7ed]",
        iconColor: "text-[#f97316]",
        progressColor: "bg-[#f97316]",
        icon: "Target",
    },
];

let userProjectsStore: Record<string, Project[]> = {
    'test@naver.com': [...mockProjects]
};

export const ProjectsService = {
    getAll: (email: string) => {
        if (email === 'test@naver.com') return userProjectsStore['test@naver.com'];
        return userProjectsStore[email] || [];
    },

    create: (email: string, data: Partial<Project>) => {
        if (!userProjectsStore[email]) {
            if (email === 'test@naver.com') userProjectsStore[email] = [...mockProjects];
            else userProjectsStore[email] = [];
        }
        const projects = userProjectsStore[email];
        const newId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1;

        // YYYY-MM-DD to YYYY.MM.DD formatting if provided from input type="date"
        let formattedDeadline = data.deadline || "미정";
        if (formattedDeadline.indexOf('-') !== -1) {
            formattedDeadline = formattedDeadline.replace(/-/g, '.');
        }

        const newProject: Project = {
            id: newId,
            name: data.name || '새 프로젝트',
            course: data.course || '기타',
            description: data.description || '',
            progress: 0,
            createdAt: data.createdAt || new Date().toISOString().split('T')[0],
            deadline: formattedDeadline,
            members: 1,
            color: data.color || "bg-[#f1f5f9]",
            iconColor: data.iconColor || "text-[#64748b]",
            progressColor: data.progressColor || "bg-[#64748b]",
            icon: data.icon || "Target",
        };

        userProjectsStore[email] = [newProject, ...projects];
        return newProject;
    },

    update: (email: string, id: number, data: Partial<Project>) => {
        const projects = userProjectsStore[email] || [];
        const index = projects.findIndex(p => p.id === id);
        if (index === -1) return null;

        let formattedDeadline = data.deadline;
        if (formattedDeadline && formattedDeadline.indexOf('-') !== -1) {
            formattedDeadline = formattedDeadline.replace(/-/g, '.');
        }

        const currentProject = projects[index];
        const updatedProject = {
            ...currentProject,
            ...data,
            deadline: formattedDeadline || currentProject.deadline
        };
        projects[index] = updatedProject;
        return updatedProject;
    },

    delete: (email: string, id: number) => {
        const projects = userProjectsStore[email] || [];
        const index = projects.findIndex(p => p.id === id);
        if (index === -1) return false;
        projects.splice(index, 1);
        return true;
    }
};
