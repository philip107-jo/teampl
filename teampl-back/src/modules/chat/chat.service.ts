import { prisma } from '../../prisma';

// 소켓 이벤트를 위한 로직 (DB 저장)
export const ChatService = {
  // 프로젝트 채팅 메시지 로드
  getProjectMessages: async (projectId: number) => {
    return await prisma.message.findMany({
      where: { projectId, receiverEmail: null },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { name: true, department: true }
        }
      }
    });
  },

  // 1:1 메시지 로드
  getDirectMessages: async (email1: string, email2: string) => {
    return await prisma.message.findMany({
      where: {
        OR: [
          { senderEmail: email1, receiverEmail: email2 },
          { senderEmail: email2, receiverEmail: email1 }
        ],
        projectId: null
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { name: true, department: true }
        }
      }
    });
  },

  // 메시지 저장 (소켓에서 호출)
  saveMessage: async (senderEmail: string, content: string, payload: { projectId?: number, receiverEmail?: string }) => {
    return await prisma.message.create({
      data: {
        senderEmail,
        content,
        projectId: payload.projectId || null,
        receiverEmail: payload.receiverEmail || null
      },
      include: {
        sender: {
          select: { name: true, department: true }
        }
      }
    });
  }
};
