import { User, Workspace, Task, ChatMessage } from './types';

export const currentUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  name: '나 (팀장)',
  studentId: '20240001',
  department: '컴퓨터공학과',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky',
  avatarColor: 'bg-[#11B886]'
};

export const initialMembers: User[] = [
  currentUser,
  { id: 'user-2', email: 'kim@example.com', name: '김철수', department: '컴퓨터공학과', avatarColor: 'bg-[#23D7A1]' },
  { id: 'user-3', email: 'lee@example.com', name: '이영희', department: '디자인학과', avatarColor: 'bg-[#FF6B7A]' },
  { id: 'user-4', email: 'park@example.com', name: '박민수', department: '소프트웨어공학', avatarColor: 'bg-[#FFB547]' },
];

export const initialWorkspace: Workspace = {
  id: 'workspace-1',
  name: '팀플 과제 앱 목업',
  subject: '캡스톤 디자인',
  notice: '이번 주 금요일까지 중간 발표 자료를 완성해야 합니다!',
  deadline: '2026-06-30',
  inviteCode: 'TEAM1234',
};

export const initialTasks: Task[] = [
  {
    id: 'task-1',
    workspaceId: 'workspace-1',
    title: 'ERD 다이어그램 작성',
    description: '데이터베이스 설계를 위한 ERD 완성',
    status: 'DONE',
    priority: 'high',
    difficulty: 5,
    deadline: '2026-03-12',
    completedAt: '2026-03-10',
    createdById: 'user-1',
    assignees: ['user-2'],
  },
  {
    id: 'task-2',
    workspaceId: 'workspace-1',
    title: 'UI 프로토타입 리뷰',
    description: 'Figma 디자인 시안 검토',
    status: 'IN_PROGRESS',
    priority: 'high',
    difficulty: 3,
    deadline: '2026-03-15',
    createdById: 'user-1',
    assignees: ['user-3'],
  },
  {
    id: 'task-3',
    workspaceId: 'workspace-1',
    title: 'API 문서 초안',
    description: '백엔드 연동을 위한 API 명세서 작성',
    status: 'TODO',
    priority: 'medium',
    difficulty: 4,
    deadline: '2026-03-20',
    createdById: 'user-1',
    assignees: ['user-1', 'user-2'],
  },
];

export const initialMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    workspaceId: 'workspace-1',
    userId: 'user-2',
    content: '안녕하세요! 다들 진행 상황 어떠신가요?',
    type: 'TEXT',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'msg-2',
    workspaceId: 'workspace-1',
    userId: 'user-1',
    content: '저는 지금 UI 작업 중입니다.',
    type: 'TEXT',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
];
