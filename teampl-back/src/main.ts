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
import globalSchedulesRouter from './modules/schedules/global-schedules.controller';
import aiRouter from './modules/ai/ai.controller';
import driveRouter from './modules/drive/drive.controller';
import chatRouter from './modules/chat/chat.controller';
import notificationsRouter from './modules/notifications/notifications.controller';
import votesRouter from './modules/votes/votes.controller';
import cardsRouter from './modules/users/cards.controller';
import { ChatService } from './modules/chat/chat.service';
import { setIo } from './socket';
import { startCronJobs } from './modules/cron/cron.service';
import { errorHandler } from './middlewares/errorHandler';

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
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Request Logger (개발 환경에서만 상세 로그)
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  }
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
app.use('/api/schedules', globalSchedulesRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/users/cards', cardsRouter);

// 프로젝트 하위 라우트 (방 기반 구조)
app.use('/api/projects/:projectId/tasks', tasksRouter);
app.use('/api/projects/:projectId/schedules', schedulesRouter);
app.use('/api/projects/:projectId/ai', aiRouter);
app.use('/api/projects/:projectId/drive', driveRouter);
app.use('/api/projects/:projectId/votes', votesRouter);

// Socket.io 통신 처리
const onlineUsers = new Set<string>();
const socketToEmail = new Map<string, string>();
const inCallUsers = new Set<string>();
const activeGroupCalls = new Map<string, { 
  participants: Map<string, { email: string, name: string, socketId: string }>, 
  startTime: number, 
  isVideo: boolean 
}>();

io.on('connection', (socket: Socket) => {
  console.log('🟢 Socket connected:', socket.id);

  socket.on('userConnected', (email: string) => {
    socketToEmail.set(socket.id, email);
    onlineUsers.add(email);
    socket.join(email); // 이메일 이름의 소켓 룸에 조인
    io.emit('onlineUsers', Array.from(onlineUsers));
    io.emit('inCallUsers', Array.from(inCallUsers));
  });

  // WebRTC 통화 상태 업데이트
  socket.on('set-call-status', (data: { isInCall: boolean }) => {
    const email = socketToEmail.get(socket.id);
    if (email) {
      if (data.isInCall) {
        inCallUsers.add(email);
      } else {
        inCallUsers.delete(email);
      }
      io.emit('inCallUsers', Array.from(inCallUsers));
    }
  });

  // 상대방 이메일 추출 유틸리티
  const getReceiverEmail = (room: string, senderEmail: string) => {
    if (room.startsWith(`${senderEmail}-`)) {
      return room.substring(senderEmail.length + 1);
    }
    if (room.endsWith(`-${senderEmail}`)) {
      return room.substring(0, room.length - senderEmail.length - 1);
    }
    return null;
  };

  // WebRTC 1:1 통화 시그널 중계
  socket.on('call-user', (data: { room: string; offer: any; callerEmail: string; callerName: string; isVideo: boolean }) => {
    const receiverEmail = getReceiverEmail(data.room, data.callerEmail);
    if (receiverEmail) {
      io.to(receiverEmail).emit('incoming-call', data);
    }
  });

  socket.on('accept-call', (data: { room: string; answer: any }) => {
    const email = socketToEmail.get(socket.id);
    if (email) {
      const receiverEmail = getReceiverEmail(data.room, email);
      if (receiverEmail) {
        io.to(receiverEmail).emit('call-accepted', data);
      }
    }
  });

  socket.on('ice-candidate', (data: { room: string; candidate: any }) => {
    const email = socketToEmail.get(socket.id);
    if (email) {
      const receiverEmail = getReceiverEmail(data.room, email);
      if (receiverEmail) {
        io.to(receiverEmail).emit('ice-candidate', data);
      }
    }
  });

  socket.on('end-call', (data: { room: string }) => {
    const email = socketToEmail.get(socket.id);
    if (email) {
      const receiverEmail = getReceiverEmail(data.room, email);
      if (receiverEmail) {
        io.to(receiverEmail).emit('call-ended', data);
      }
    }
  });

  // 그룹 통화 퇴장 함수
  const leaveGroupCall = async (room: string) => {
    const call = activeGroupCalls.get(room);
    if (!call) return;

    call.participants.delete(socket.id);
    socket.leave(`group-call-${room}`);

    // 다른 참여자들에게 퇴장 알림
    socket.to(`group-call-${room}`).emit('peer-left', {
      socketId: socket.id
    });

    const participantsList = Array.from(call.participants.values());
    
    if (call.participants.size === 0) {
      // 통화 종료
      const durationSec = Math.floor((Date.now() - call.startTime) / 1000);
      activeGroupCalls.delete(room);

      io.to(room).emit('group-call-ended', { room });

      // 그룹 통화 종료 메시지 DB 저장 및 브로드캐스트
      try {
        const projectId = parseInt(room.replace('team-', ''), 10);
        const email = socketToEmail.get(socket.id) || '';
        const savedMsg = await ChatService.saveMessage(email, `[GROUP_CALL_END]:${call.isVideo ? 'video' : 'voice'}:${durationSec}`, {
          projectId
        });
        io.to(room).emit('newMessage', savedMsg);
      } catch (e) {
        console.error('Failed to save group call end message:', e);
      }
    } else {
      // 활성 상태 업데이트 브로드캐스트
      io.to(room).emit('group-call-active', {
        room,
        participants: participantsList,
        isVideo: call.isVideo
      });
    }
  };

  // 그룹 통화 참가
  socket.on('join-group-call', async (data: { room: string, email: string, name: string, isVideo: boolean }) => {
    let call = activeGroupCalls.get(data.room);
    if (!call) {
      call = {
        participants: new Map(),
        startTime: Date.now(),
        isVideo: data.isVideo
      };
      activeGroupCalls.set(data.room, call);

      // 그룹 통화 시작 메시지 DB 저장 및 브로드캐스트
      try {
        const projectId = parseInt(data.room.replace('team-', ''), 10);
        const savedMsg = await ChatService.saveMessage(data.email, `[GROUP_CALL_START]:${data.isVideo ? 'video' : 'voice'}`, {
          projectId
        });
        io.to(data.room).emit('newMessage', savedMsg);
      } catch (e) {
        console.error('Failed to save group call start message:', e);
      }
    }

    const participantInfo = { email: data.email, name: data.name, socketId: socket.id };
    call.participants.set(socket.id, participantInfo);
    
    socket.join(`group-call-${data.room}`);

    socket.to(`group-call-${data.room}`).emit('peer-joined', {
      socketId: socket.id,
      email: data.email,
      name: data.name
    });

    const participantsList = Array.from(call.participants.values());
    io.to(data.room).emit('group-call-active', {
      room: data.room,
      participants: participantsList,
      isVideo: call.isVideo
    });
  });

  // 그룹 통화 시그널링 중계
  socket.on('send-group-signal', (data: { targetSocketId: string, signal: any }) => {
    io.to(data.targetSocketId).emit('signal-received', {
      senderSocketId: socket.id,
      signal: data.signal
    });
  });

  socket.on('leave-group-call', (data: { room: string }) => {
    leaveGroupCall(data.room);
  });

  // 방 입장 (프로젝트방 또는 1:1방)
  socket.on('joinRoom', (roomName: string) => {
    socket.join(roomName);
    
    // 만약 프로젝트방에 입장했고, 그 프로젝트방에 진행중인 그룹 통화가 있다면 상태 알려줌
    if (roomName.startsWith('team-')) {
      const call = activeGroupCalls.get(roomName);
      if (call) {
        socket.emit('group-call-active', {
          room: roomName,
          participants: Array.from(call.participants.values()),
          isVideo: call.isVideo
        });
      }
    }
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
  });

  // AI 카드 내 개별 태스크 선점 처리
  socket.on('claimAiTask', (data: { room: string, messageId: string, taskId: string, userEmail: string, userName: string }) => {
    // 룸 내 모든 이에게 누가 무엇을 가져갔는지 방송 (보낸 사람 포함)
    io.to(data.room).emit('aiTaskClaimed', data);
  });

  socket.on('disconnect', async () => {
    // 그룹 통화 중 퇴장 처리
    for (const [room, call] of activeGroupCalls.entries()) {
      if (call.participants.has(socket.id)) {
        await leaveGroupCall(room);
      }
    }

    const email = socketToEmail.get(socket.id);
    if (email) {
      onlineUsers.delete(email);
      inCallUsers.delete(email);
      socketToEmail.delete(socket.id);
      io.emit('onlineUsers', Array.from(onlineUsers));
      io.emit('inCallUsers', Array.from(inCallUsers));
    }
  });
});

// Global Error Handler
app.use(errorHandler);

httpServer.listen(port, () => {
  console.log(`🚀 Server & Socket.io are running on http://localhost:${port}`);
  startCronJobs();
});
