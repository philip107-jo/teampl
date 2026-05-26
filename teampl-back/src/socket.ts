import { Server } from 'socket.io';

let io: Server;

export const setIo = (serverIo: Server) => {
  io = serverIo;
};

export const getIo = () => {
  return io;
};

export const emitTaskUpdate = (projectId: number) => {
  if (io) {
    io.to(`project-${projectId}`).emit('taskUpdated');
  }
};

export const emitDriveUpdate = (projectId: number) => {
  if (io) {
    io.to(`project-${projectId}`).emit('driveUpdated');
  }
};
