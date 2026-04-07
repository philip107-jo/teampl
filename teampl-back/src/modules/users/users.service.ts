import { prisma } from '../../prisma';

export const UsersService = {
  create: async (data: any) => {
    return await prisma.user.create({ data });
  },
  findByEmail: async (email: string) => {
    return await prisma.user.findUnique({ where: { email } });
  },
  findById: async (id: string) => {
    return await prisma.user.findUnique({ where: { id } });
  },
  updateProfile: async (id: string, data: { name?: string; studentId?: string; department?: string }) => {
    return await prisma.user.update({
      where: { id },
      data
    });
  },
  linkMicrosoftAccount: async (id: string, msAccountId: string, msRefreshToken: string) => {
    // 만약 이 msAccountId를 이미 누군가 쓰고 있다면, 그 사람의 연동을 먼저 해제함 (Unique 제약 조건 위반 방지)
    await prisma.user.updateMany({
      where: { msAccountId },
      data: { msAccountId: null, msRefreshToken: null, isUnivVerified: false }
    });

    return await prisma.user.update({
      where: { id },
      data: {
        msAccountId,
        msRefreshToken,
        isUnivVerified: true
      }
    });
  }
};
