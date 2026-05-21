import cron from 'node-cron';
import { prisma } from '../../prisma';
import { NotificationsService } from '../notifications/notifications.service';

export const startCronJobs = () => {
  // 매일 오전 9시에 실행
  cron.schedule('0 9 * * *', async () => {
    try {
      console.log('[CRON] Starting deadline checks...');
      const today = new Date();
      
      const d1 = new Date(today);
      d1.setDate(d1.getDate() + 1);
      const d1Str = d1.toISOString().split('T')[0];

      const d3 = new Date(today);
      d3.setDate(d3.getDate() + 3);
      const d3Str = d3.toISOString().split('T')[0];

      // 1. Task D-1, D-3 확인
      const tasks = await prisma.task.findMany({
        where: {
          status: { not: 'DONE' },
          OR: [
            { deadline: { startsWith: d1Str } },
            { deadline: { startsWith: d3Str } }
          ]
        },
        include: { project: true }
      });

      for (const task of tasks) {
        const isD1 = task.deadline.startsWith(d1Str);
        const dDayText = isD1 ? 'D-1' : 'D-3';
        
        // 담당자들에게 알림 전송
        for (const assignee of task.assignees) {
          await NotificationsService.createNotification({
            userEmail: assignee,
            type: 'alert',
            title: `과제 마감일 임박 (${dDayText})`,
            content: `'${task.title}' 과제 마감이 ${dDayText} 남았습니다.`,
            link: `/projects/${task.projectId}`
          });
        }
      }

      // 2. Schedule D-1, D-3 확인
      const schedules = await prisma.schedule.findMany({
        where: {
          OR: [
            { date: { startsWith: d1Str } },
            { date: { startsWith: d3Str } }
          ]
        },
        include: { project: true }
      });

      for (const schedule of schedules) {
        if (!schedule.project) continue;
        const isD1 = schedule.date.startsWith(d1Str);
        const dDayText = isD1 ? 'D-1' : 'D-3';

        // 프로젝트의 모든 활성 멤버에게 알림 전송
        const members = await prisma.projectMember.findMany({
          where: { projectId: schedule.project.id, status: 'ACTIVE' }
        });

        for (const member of members) {
          await NotificationsService.createNotification({
            userEmail: member.userEmail,
            type: 'alert',
            title: `일정 임박 (${dDayText})`,
            content: `'${schedule.title}' 일정이 ${dDayText} 남았습니다.`,
            link: `/projects/${schedule.project.id}`
          });
        }
      }

      console.log('[CRON] Deadline checks completed.');
    } catch (e) {
      console.error('[CRON] Error during deadline checks:', e);
    }
  });
};
