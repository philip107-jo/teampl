import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

import projectsRouter from './modules/Projects/projects.controller';
import authRouter from './modules/Auth/auth.controller';
import usersRouter from './modules/users/users.controller';
import tasksRouter from './modules/Tasks/tasks.controller';
import schedulesRouter from './modules/Schedules/schedules.controller';
import aiRouter from './modules/Ai/ai.controller';
import driveRouter from './modules/drive/drive.controller';
import chatRouter from './modules/chat/chat.controller';
import { ChatService } from './modules/chat/chat.service';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
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

// 프로젝트 하위 라우트 (방 기반 구조)
app.use('/api/projects/:projectId/tasks', tasksRouter);
app.use('/api/projects/:projectId/schedules', schedulesRouter);
app.use('/api/projects/:projectId/ai', aiRouter);
app.use('/api/projects/:projectId/drive', driveRouter);

// Socket.io 통신 처리
io.on('connection', (socket) => {
  console.log('🟢 Client connected directly:', socket.id);

  // 방 입장 (프로젝트방 또는 1:1방)
  socket.on('joinRoom', (roomName: string) => {
    socket.join(roomName);
    console.log(`Socket ${socket.id} joined room: ${roomName}`);
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
    } catch (e) {
      console.error('Failed to save message:', e);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
  });
});

import { errorHandler } from './middlewares/errorHandler';
// Global Error Handler
app.use(errorHandler);

httpServer.listen(port, () => {
  console.log(`🚀 Server & Socket.io are running on http://localhost:${port}`);
});
