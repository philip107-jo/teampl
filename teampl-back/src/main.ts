import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tasksRouter from './modules/tasks/tasks.controller';
import projectsRouter from './modules/projects/projects.controller';

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

app.use('/api/tasks', tasksRouter);
app.use('/api/projects', projectsRouter);

app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
