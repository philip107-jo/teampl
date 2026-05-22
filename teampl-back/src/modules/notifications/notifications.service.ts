import { prisma } from '../../prisma';
import webpush from 'web-push';
import { getIo } from '../../socket';

import { config } from '../../lib/config';

// Setup web-push
webpush.setVapidDetails(
  config.vapid.subject,
  config.vapid.publicKey,
  config.vapid.privateKey
);

export const NotificationsService = {
  getNotifications: async (userEmail: string) => {
    return await prisma.notification.findMany({
      where: { userEmail },
      orderBy: { createdAt: 'desc' }
    });
  },

  createNotification: async (data: { userEmail: string, type: string, title: string, content: string, link?: string }) => {
    const notification = await prisma.notification.create({ data });
    
    // 푸시 알림 전송 로직
    try {
      const subscriptions = await prisma.pushSubscription.findMany({
        where: { userEmail: data.userEmail }
      });
      
      const payload = JSON.stringify({
        title: data.title,
        body: data.content,
        icon: '/vite.svg', // Change this to your icon
        url: data.link || '/projects?tab=tasks'
      });

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification({
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          }, payload);
        } catch (e: any) {
          if (e.statusCode === 410 || e.statusCode === 404) {
            // 만료되거나 유효하지 않은 구독 삭제
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          } else {
            console.error("Push Notification Error:", e);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
    }

    // 소켓으로 실시간 알림 전송
    try {
      const io = getIo();
      if (io) {
        io.emit(`notification:${data.userEmail}`, notification);
      }
    } catch (_) {}

    return notification;
  },

  markAsRead: async (userEmail: string, notificationId: number) => {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification || notification.userEmail !== userEmail) {
      throw new Error("알림을 찾을 수 없거나 권한이 없습니다.");
    }
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
  },

  markAllAsRead: async (userEmail: string) => {
    return await prisma.notification.updateMany({
      where: { userEmail, isRead: false },
      data: { isRead: true }
    });
  },

  // 웹 푸시 구독 추가
  subscribePush: async (userEmail: string, subscription: any) => {
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint }
    });

    if (existing) {
      return existing;
    }

    return await prisma.pushSubscription.create({
      data: {
        userEmail,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    });
  },

  // 웹 푸시 구독 취소
  unsubscribePush: async (userEmail: string, endpoint: string) => {
    return await prisma.pushSubscription.deleteMany({
      where: { userEmail, endpoint }
    });
  }
};
