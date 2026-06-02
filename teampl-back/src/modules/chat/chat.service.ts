import { prisma } from '../../prisma';
import { NotificationsService } from '../notifications/notifications.service';
import { verifyMembership } from '../projects/membership';

// 소켓 이벤트를 위한 로직 (DB 저장)
export const ChatService = {
  // 프로젝트 채팅 메시지 로드
  getProjectMessages: async (email: string, projectId: number) => {
    await verifyMembership(email, projectId);
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
    const message = await prisma.message.create({
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

    // 멘션 알림 처리 (프로젝트 채팅방의 경우)
    if (payload.projectId) {
      const members = await prisma.projectMember.findMany({
        where: { projectId: payload.projectId, status: 'ACTIVE' },
        include: { user: true }
      });
      
      const project = await prisma.project.findUnique({ where: { id: payload.projectId } });
      const projectName = project ? project.name : '프로젝트';

      const notificationPromises: Promise<any>[] = [];
      for (const member of members) {
        if (member.userEmail === senderEmail) continue;
        
        // 멘션 포함 여부 검사 (@이름)
        if (content.includes(`@${member.user.name}`)) {
          notificationPromises.push(NotificationsService.createNotification({
            userEmail: member.userEmail,
            type: 'mention',
            title: '새로운 멘션',
            content: `'${projectName}' 채팅방에서 ${message.sender.name}님이 회원님을 멘션했습니다.`,
            link: `/projects/${payload.projectId}?tab=chat`
          }));
        }
      }
      if (notificationPromises.length > 0) {
        await Promise.all(notificationPromises);
      }
    }

    return message;
  },

  getReadStates: async (userEmail: string) => {
    return await prisma.chatRead.findMany({
      where: { userEmail }
    });
  },

  getRoomReadStates: async (roomKey: string) => {
    return await prisma.chatRead.findMany({
      where: { roomKey },
      select: { userEmail: true, lastReadMsgId: true }
    });
  },

  updateLastRead: async (userEmail: string, roomKey: string, lastReadMsgId: number) => {
    return await prisma.chatRead.upsert({
      where: {
        userEmail_roomKey: {
          userEmail,
          roomKey
        }
      },
      update: { lastReadMsgId },
      create: { userEmail, roomKey, lastReadMsgId }
    });
  },

  updatePin: async (messageId: number, isPinned: boolean) => {
    return await prisma.message.update({
      where: { id: messageId },
      data: { isPinned }
    });
  },

  getUnreadCounts: async (email: string) => {
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
      }
    });

    const readStates = await prisma.chatRead.findMany({
      where: { userEmail: email }
    });
    
    const readMap: Record<string, number> = {};
    readStates.forEach(s => {
      readMap[s.roomKey] = s.lastReadMsgId;
    });

    const unreadCounts: Record<string, number> = {};

    for (const membership of memberships) {
      const project = membership.project;
      const projectId = project.id;

      // 1. Team Room Key
      const teamRoomKey = `team-${projectId}`;
      const lastReadTeamMsgId = readMap[teamRoomKey] || 0;
      const teamUnreadCount = await prisma.message.count({
        where: {
          projectId,
          receiverEmail: null,
          id: { gt: lastReadTeamMsgId }
        }
      });
      if (teamUnreadCount > 0) {
        unreadCounts[teamRoomKey] = teamUnreadCount;
      }

      // 2. DM Rooms (1:1 with other project members)
      if (project.projectMembers) {
        for (const pm of project.projectMembers) {
          if (pm.userEmail === email) continue;

          const dmRoomKey = [email, pm.userEmail].sort().join('-');
          const lastReadDmMsgId = readMap[dmRoomKey] || 0;
          
          const dmUnreadCount = await prisma.message.count({
            where: {
              senderEmail: pm.userEmail,
              receiverEmail: email,
              projectId: null,
              id: { gt: lastReadDmMsgId }
            }
          });

          if (dmUnreadCount > 0) {
            unreadCounts[dmRoomKey] = dmUnreadCount;
            unreadCounts[`user-${projectId}-${pm.user.id}`] = dmUnreadCount;
          }
        }
      }
    }

    return unreadCounts;
  }
};
