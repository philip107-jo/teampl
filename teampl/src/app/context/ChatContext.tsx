import React, { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from "socket.io-client";

import { chatApi } from '../api/chatApi';

export interface Message {
  id: string;
  sender: string;
  content: string;
  time: string;
  isMe: boolean;
  createdAt?: string;
}

interface ChatContextType {
  unreadCounts: Record<string, number>;
  totalUnreadCount: number;
  messagesStore: Record<string, Message[]>;
  onlineUsers: string[];
  socket: Socket | null;
  activeChatKey: string | null;
  notificationCount: number;
  readStates: Record<string, number>;
  clearNotifications: () => void;
  incrementUnread: (key: string, amount?: number) => void;
  clearUnread: (key: string) => void;
  setMessages: (key: string, msgs: Message[]) => void;
  addMessage: (key: string, msg: Message) => void;
  setActiveChatKey: (key: string | null) => void;
  initProjectChat: (projectId: number, userEmail: string, members: any[]) => void;
  updateReadState: (roomKey: string, msgId: number) => Promise<void>;
  simulateNoti: (keys: string[]) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [messagesStore, setMessagesStore] = useState<Record<string, Message[]>>({});
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeChatKey, setActiveChatKey] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [readStates, setReadStates] = useState<Record<string, number>>({});

  const activeChatKeyRef = useRef<string | null>(null);
  const projectMembersRef = useRef<any[]>([]);
  const currentProjectIdRef = useRef<number | null>(null);
  const currentUserEmailRef = useRef<string | null>(null);
  const readStatesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    activeChatKeyRef.current = activeChatKey;
    projectMembersRef.current = projectMembers;
    currentProjectIdRef.current = currentProjectId;
    currentUserEmailRef.current = currentUserEmail;
    readStatesRef.current = readStates;
  }, [activeChatKey, projectMembers, currentProjectId, currentUserEmail, readStates]);

  // 전역 소켓 초기화 (한 번만 실행)
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8080';
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    return () => { newSocket.disconnect(); };
  }, []);

  // 소켓 이벤트 리스너 분리
  useEffect(() => {
    if (!socket) return;

    const onOnlineUsers = (users: string[]) => {
      setOnlineUsers(users);
    };

    const onNewMessage = (m: any) => {
      // 1. 메시지 정보 추출
      const senderEmail = m.senderEmail;
      const mProjectId = m.projectId;
      const receiverEmail = m.receiverEmail;
      
      const msgRoom = m.room || (mProjectId ? `team-${mProjectId}` : [senderEmail, receiverEmail].sort().join('-'));
      
      // 2. 메시지 저장소 업데이트 (전역)
      const formatted: Message = {
        id: String(m.id),
        sender: m.sender?.name || senderEmail.split('@')[0],
        content: m.content,
        time: new Date(m.createdAt).toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true }),
        isMe: senderEmail === currentUserEmailRef.current
      };
      
      setMessagesStore(prev => ({
        ...prev,
        [msgRoom]: [...(prev[msgRoom] || []), formatted]
      }));

      // 3. 알림 업데이트 (현재 보고 있지 않은 방이고, 내가 보낸 게 아닐 때)
      if (msgRoom !== activeChatKeyRef.current && senderEmail !== currentUserEmailRef.current) {
        setUnreadCounts(prev => {
          const isUnread = Number(formatted.id) > (readStatesRef.current[msgRoom] || 0);
          if (!isUnread) return prev;

          let notificationKey = msgRoom;
          if (!mProjectId && !m.room && senderEmail) {
             const senderMember = projectMembersRef.current.find(pm => pm.email === senderEmail);
             if (senderMember && currentProjectIdRef.current) {
                const idKey = `user-${currentProjectIdRef.current}-${senderMember.id}`;
                return { ...prev, [idKey]: (prev[idKey] || 0) + 1, [msgRoom]: (prev[msgRoom] || 0) + 1 };
             }
          }
          return { ...prev, [msgRoom]: (prev[msgRoom] || 0) + 1 };
        });
      }
    };

    socket.on('onlineUsers', onOnlineUsers);
    socket.on('newMessage', onNewMessage);

    return () => {
      socket.off('onlineUsers', onOnlineUsers);
      socket.off('newMessage', onNewMessage);
    };
  }, [socket]);

  // 실시간 알림 수신 (currentUserEmail 변경 시 리스너 재등록)
  useEffect(() => {
    if (!socket || !currentUserEmail) return;
    const onNotification = () => {
      setNotificationCount(prev => prev + 1);
    };
    const eventName = `notification:${currentUserEmail}`;
    socket.on(eventName, onNotification);
    return () => { socket.off(eventName, onNotification); };
  }, [socket, currentUserEmail]);

  const totalUnreadCount = useMemo(() => {
    return Object.values(unreadCounts).reduce((acc, curr) => acc + curr, 0);
  }, [unreadCounts]);

  const clearNotifications = useCallback(() => {
    setNotificationCount(0);
  }, []);

  const incrementUnread = useCallback((key: string, amount: number = 1) => {
    setUnreadCounts(prev => ({ ...prev, [key]: (prev[key] || 0) + amount }));
  }, []);

  const clearUnread = useCallback((key: string) => {
    setUnreadCounts(prev => {
      if (!prev[key]) return prev;
      return { ...prev, [key]: 0 };
    });
  }, []);

  const setMessages = useCallback((key: string, msgs: Message[]) => {
    setMessagesStore(prev => ({ ...prev, [key]: msgs }));
    
    // 정확도 100% 읽음 카운트 동기화
    setUnreadCounts(prev => {
      const lastReadId = readStatesRef.current[key] || 0;
      const exactUnread = msgs.filter(m => !m.isMe && Number(m.id) > lastReadId).length;
      return { ...prev, [key]: exactUnread };
    });
  }, []);

  const addMessage = useCallback((key: string, msg: Message) => {
    setMessagesStore(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), msg]
    }));
  }, []);

  const initProjectChat = useCallback(async (projectId: number, userEmail: string, members: any[]) => {
    if (!socket) return;
    setCurrentUserEmail(userEmail);
    setCurrentProjectId(projectId);
    setProjectMembers(members);
    
    // 초기 읽음 상태 동기화
    try {
      const states = await chatApi.getReadStates();
      const readMap: Record<string, number> = {};
      states.forEach(s => readMap[s.roomKey] = s.lastReadMsgId);
      setReadStates(readMap);
    } catch (e) {
      console.error(e);
    }

    socket.emit('userConnected', userEmail);
    socket.emit('joinRoom', `team-${projectId}`);
    members.forEach(m => {
      if (m.email && m.email !== userEmail) {
        const dmRoom = [userEmail, m.email].sort().join('-');
        socket.emit('joinRoom', dmRoom);
      }
    });
  }, [socket]);

  const updateReadState = useCallback(async (roomKey: string, msgId: number) => {
    setReadStates(prev => {
      if ((prev[roomKey] || 0) >= msgId) return prev;
      return { ...prev, [roomKey]: msgId };
    });
    // DB 업데이트
    chatApi.updateLastRead(roomKey, msgId).catch(console.error);
    clearUnread(roomKey); // UI 초기화
  }, [clearUnread]);

  const simulateNoti = useCallback((keys: string[]) => {
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const amount = Math.random() > 0.5 ? 1 : 1200;
    
    setUnreadCounts(prev => ({
      ...prev,
      [randomKey]: (prev[randomKey] || 0) + amount
    }));
  }, []);

  return (
    <ChatContext.Provider value={{
      unreadCounts, totalUnreadCount, messagesStore, onlineUsers, socket, activeChatKey,
      notificationCount, readStates, clearNotifications,
      incrementUnread, clearUnread, setMessages, addMessage, setActiveChatKey, initProjectChat,
      updateReadState, simulateNoti
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
