import { io, Socket } from "socket.io-client";

const socketUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8080';
export const socket: Socket = io(socketUrl, {
    autoConnect: true,
    reconnection: true
});

// Helper to join channels
export const joinProjectChannel = (projectId: number) => {
    socket.emit('joinProject', projectId);
};

export const joinChatRoom = (roomName: string) => {
    socket.emit('joinRoom', roomName);
};
