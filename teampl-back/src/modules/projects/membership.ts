import { prisma } from '../../prisma';

// 해당 프로젝트의 멤버인지 확인하는 공통 헬퍼
export async function verifyMembership(email: string, projectId: number) {
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
