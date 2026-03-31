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
    inviteCode?: string; // 프로젝트 초대 코드
    userName?: string; // 생성 및 가입 시 사용자 이름 
    creatorEmail?: string; // 방장 이메일
    membersList?: { id: number; name: string; avatarColor: string }[];
}

// 초대 코드 생성 유틸리티
const generateInviteCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

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
        inviteCode: "TEAMPL",
        creatorEmail: "test@naver.com",
        membersList: [
            { id: 1, name: "나 (팀장)", avatarColor: "bg-[#7C6CFF]" },
            { id: 2, name: "김철수", avatarColor: "bg-[#27D7A1]" },
            { id: 3, name: "이영희", avatarColor: "bg-[#7C6CFF]" },
            { id: 4, name: "박민수", avatarColor: "bg-[#FFB547]" },
        ],
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
        creatorEmail: "test@naver.com",
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
        creatorEmail: "test@naver.com",
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
        creatorEmail: "test@naver.com",
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
            membersList: [{ id: 1, name: data.userName || email.split('@')[0], avatarColor: "bg-[#7C6CFF]" }],
            color: data.color || "bg-[#f1f5f9]",
            iconColor: data.iconColor || "text-[#64748b]",
            progressColor: data.progressColor || "bg-[#64748b]",
            icon: data.icon || "Target",
            inviteCode: generateInviteCode(),
            creatorEmail: email,
        };

        userProjectsStore[email] = [newProject, ...projects];
        return newProject;
    },

    join: (email: string, code: string, userName?: string) => {
        if (!code) return null;
        
        let foundProject: Project | null = null;
        // 전체 유저의 프로젝트 저장소를 돌며 초대코드와 일치하는 프로젝트 검색 (공유 참조)
        for (const userEmail of Object.keys(userProjectsStore)) {
            const match = userProjectsStore[userEmail].find(p => p.inviteCode === code);
            if (match) {
                foundProject = match;
                break;
            }
        }

        if (!foundProject) return null;

        if (!userProjectsStore[email]) {
            userProjectsStore[email] = [];
        }

        // 이미 가입된 방인지 확인
        const alreadyJoined = userProjectsStore[email].find(p => p.id === foundProject!.id);
        if (alreadyJoined) return foundProject; // 이미 가입된 경우 그대로 리턴

        // 인원 및 팀원 리스트 추가
        foundProject.members += 1;
        const colorList = ["bg-[#27D7A1]", "bg-[#FFB547]", "bg-[#FF6B7A]", "bg-[#4D8DFF]"];
        const randomColor = colorList[foundProject.members % colorList.length];
        if (!foundProject.membersList) foundProject.membersList = [];
        foundProject.membersList.push({
            id: foundProject.members,
            name: userName || email.split('@')[0],
            avatarColor: randomColor
        });

        // 새로운 유저의 저장소에 검색된 프로젝트 참조 추가
        userProjectsStore[email] = [foundProject, ...userProjectsStore[email]];
        return foundProject;
    },

    update: (email: string, id: number, data: Partial<Project>) => {
        const projects = userProjectsStore[email] || [];
        const index = projects.findIndex(p => p.id === id);
        if (index === -1) return null;

        const currentProject = projects[index];
        if (currentProject.creatorEmail && currentProject.creatorEmail !== email) {
            return null; // 권한 없음
        }

        let formattedDeadline = data.deadline;
        if (formattedDeadline && formattedDeadline.indexOf('-') !== -1) {
            formattedDeadline = formattedDeadline.replace(/-/g, '.');
        }

        Object.assign(currentProject, data, {
            deadline: formattedDeadline || currentProject.deadline
        });

        return currentProject;
    },

    delete: (email: string, id: number) => {
        const projects = userProjectsStore[email] || [];
        const index = projects.findIndex(p => p.id === id);
        if (index === -1) return false;

        const currentProject = projects[index];
        if (currentProject.creatorEmail && currentProject.creatorEmail !== email) {
            return false; // 권한 없음
        }

        for (const userEmail of Object.keys(userProjectsStore)) {
            userProjectsStore[userEmail] = userProjectsStore[userEmail].filter(p => p.id !== id);
        }
        
        return true;
    }
};
