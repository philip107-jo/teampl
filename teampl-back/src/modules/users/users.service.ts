import { prisma } from '../../prisma';

export const UsersService = {
  create: async (data: any) => {
    return await prisma.user.create({ data });
  },
  findByEmail: async (email: string) => {
    return await prisma.user.findUnique({ where: { email } });
  },
  findById: async (id: number) => {
    return await prisma.user.findUnique({ where: { id } });
  }
};
