import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import projectsRouter from './modules/projects/projects.controller';
import authRouter from './modules/auth/auth.controller';
import usersRouter from './modules/users/users.controller';
import tasksRouter from './modules/tasks/tasks.controller';
import schedulesRouter from './modules/schedules/schedules.controller';

dotenv.config();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Teampl Backend is running' });
});

// 기존 글로벌 라우트
app.use('/api/projects', projectsRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);

// 프로젝트 하위 라우트 (방 기반 구조)
app.use('/api/projects/:projectId/tasks', tasksRouter);
app.use('/api/projects/:projectId/schedules', schedulesRouter);

import { errorHandler } from './middlewares/errorHandler';
// Global Error Handler
app.use(errorHandler);

app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
