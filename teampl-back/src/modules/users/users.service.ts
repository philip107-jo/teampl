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
  updateProfile: async (id: string, data: { name?: string; studentId?: string; department?: string; avatarUrl?: string }) => {
    return await prisma.user.update({
      where: { id },
      data
    });
  },

};
