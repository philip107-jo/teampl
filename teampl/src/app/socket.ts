import { io, Socket } from "socket.io-client";

const apiBase = import.meta.env.VITE_API_BASE_URL;
const socketUrl = (apiBase && apiBase.startsWith('http'))
    ? apiBase.replace('/api', '')
    : window.location.origin;

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
