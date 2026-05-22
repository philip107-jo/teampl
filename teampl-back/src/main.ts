import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import path from 'path';

import projectsRouter from './modules/projects/projects.controller';
import authRouter from './modules/auth/auth.controller';
import usersRouter from './modules/users/users.controller';
import tasksRouter from './modules/tasks/tasks.controller';
import schedulesRouter from './modules/schedules/schedules.controller';
import aiRouter from './modules/ai/ai.controller';
import driveRouter from './modules/drive/drive.controller';
import chatRouter from './modules/chat/chat.controller';
import notificationsRouter from './modules/notifications/notifications.controller';
import votesRouter from './modules/votes/votes.controller';
import { ChatService } from './modules/chat/chat.service';
import { setIo } from './socket';
import { startCronJobs } from './modules/cron/cron.service';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ["GET", "POST"]
  }
});
setIo(io);

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Teampl Backend is running' });
});

// 기존 글로벌 라우트
app.use('/api/projects', projectsRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/chat', chatRouter);
import globalSchedulesRouter from './modules/schedules/global-schedules.controller';
app.use('/api/schedules', globalSchedulesRouter);
app.use('/api/notifications', notificationsRouter);

// 프로젝트 하위 라우트 (방 기반 구조)
app.use('/api/projects/:projectId/tasks', tasksRouter);
app.use('/api/projects/:projectId/schedules', schedulesRouter);
app.use('/api/projects/:projectId/ai', aiRouter);
app.use('/api/projects/:projectId/drive', driveRouter);
app.use('/api/projects/:projectId/votes', votesRouter);

// Socket.io 통신 처리
const onlineUsers = new Set<string>();
const socketToEmail = new Map<string, string>();

io.on('connection', (socket: Socket) => {
  console.log('🟢 Client connected directly:', socket.id);

  socket.on('userConnected', (email: string) => {
    socketToEmail.set(socket.id, email);
    onlineUsers.add(email);
    io.emit('onlineUsers', Array.from(onlineUsers));
  });

  // 방 입장 (프로젝트방 또는 1:1방)
  socket.on('joinRoom', (roomName: string) => {
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room: ${roomName}`);
  });

  // 타이핑 인디케이터
  socket.on('typing', (data: { room: string, email: string, isTyping: boolean }) => {
    socket.to(data.room).emit('userTyping', data);
  });

  // 메시지 전송
  socket.on('sendMessage', async (data: { room: string, senderEmail: string, content: string, projectId?: number, receiverEmail?: string }) => {
    try {
      // DB 저장
      const savedMsg = await ChatService.saveMessage(data.senderEmail, data.content, {
        projectId: data.projectId,
        receiverEmail: data.receiverEmail
      });
      // 방 전체(보낸 사람 포함)에 발송
      io.to(data.room).emit('newMessage', savedMsg);
      
      // 만약 프로젝트 관련 메시지라면 장기적으로 프로젝트 방에도 입수되도록 알림
      if (data.projectId) {
        io.to(`project-${data.projectId}`).emit('roomActivity', { room: data.room });
      }
    } catch (e) {
      console.error('Failed to save message:', e);
    }
  });

  // 태스크 업데이트 등을 위한 프로젝트 전용 소켓 룸 입장
  socket.on('joinProject', (projectId: number) => {
    socket.join(`project-${projectId}`);
    console.log(`Socket ${socket.id} subscribed to project updates: ${projectId}`);
  });

  // AI 카드 내 개별 태스크 선점 처리
  socket.on('claimAiTask', (data: { room: string, messageId: string, taskId: string, userEmail: string, userName: string }) => {
    // 룸 내 모든 이에게 누가 무엇을 가져갔는지 방송 (보낸 사람 포함)
    io.to(data.room).emit('aiTaskClaimed', data);
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
    const email = socketToEmail.get(socket.id);
    if (email) {
      onlineUsers.delete(email);
      socketToEmail.delete(socket.id);
      io.emit('onlineUsers', Array.from(onlineUsers));
    }
  });
});

import { errorHandler } from './middlewares/errorHandler';
// Global Error Handler
app.use(errorHandler);

httpServer.listen(port, () => {
  console.log(`🚀 Server & Socket.io are running on http://localhost:${port}`);
  startCronJobs();
});
