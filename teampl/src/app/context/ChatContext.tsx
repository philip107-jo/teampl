import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { io, Socket } from "socket.io-client";

interface Message {
  id: string;
  sender: string;
  content: string;
  time: string;
  isMe: boolean;
}

interface ChatContextType {
  unreadCounts: Record<string, number>;
  totalUnreadCount: number;
  messagesStore: Record<string, Message[]>;
  socket: Socket | null;
  activeChatKey: string | null;
  incrementUnread: (key: string, amount?: number) => void;
  clearUnread: (key: string) => void;
  setMessages: (key: string, msgs: Message[]) => void;
  addMessage: (key: string, msg: Message) => void;
  setActiveChatKey: (key: string | null) => void;
  initProjectChat: (projectId: number, userEmail: string, members: any[]) => void;
  simulateNoti: (keys: string[]) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [messagesStore, setMessagesStore] = useState<Record<string, Message[]>>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeChatKey, setActiveChatKey] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);

  // 전역 소켓 초기화
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8080';
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    // 전역 메시지 리스너 (백그라운드 알림용)
    newSocket.on('newMessage', (m: any) => {
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
        isMe: false // 수신된 메시지이므로 항상 false
      };
      
      setMessagesStore(prev => ({
        ...prev,
        [msgRoom]: [...(prev[msgRoom] || []), formatted]
      }));

      // 3. 알림 업데이트 (현재 보고 있지 않은 방이고, 내가 보낸 게 아닐 때)
      // (서버에서 받은 거라 isMe 체크 불필요할 수도 있지만 안전을 위해)
      setUnreadCounts(prev => {
        // 현재 활성 방이거나 로비가 아닌 다른 방인 경우 숫자 증가
        // (참고: Chat.tsx에서 입장 시 setActiveChatKey 호출)
        if (msgRoom !== activeChatKey) {
           // DM인 경우 로비용 ID 키 매핑 필요
           let notificationKey = msgRoom;
           if (!mProjectId && !m.room && senderEmail) {
              // Context가 멤버 정보를 알고 있어야 함
              const senderMember = projectMembers.find(pm => pm.email === senderEmail);
              if (senderMember && currentProjectId) {
                 const idKey = `user-${currentProjectId}-${senderMember.id}`;
                 return { ...prev, [idKey]: (prev[idKey] || 0) + 1, [msgRoom]: (prev[msgRoom] || 0) + 1 };
              }
           }
           return { ...prev, [msgRoom]: (prev[msgRoom] || 0) + 1 };
        }
        return prev;
      });
    });

    return () => { newSocket.disconnect(); };
  }, [activeChatKey, projectMembers, currentProjectId]); // 의존성 주의

  const totalUnreadCount = useMemo(() => {
    return Object.values(unreadCounts).reduce((acc, curr) => acc + curr, 0);
  }, [unreadCounts]);

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
  }, []);

  const addMessage = useCallback((key: string, msg: Message) => {
    setMessagesStore(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), msg]
    }));
  }, []);

  const initProjectChat = useCallback((projectId: number, userEmail: string, members: any[]) => {
    if (!socket) return;
    setCurrentUserEmail(userEmail);
    setCurrentProjectId(projectId);
    setProjectMembers(members);
    
    socket.emit('joinRoom', `team-${projectId}`);
    members.forEach(m => {
      if (m.email && m.email !== userEmail) {
        const dmRoom = [userEmail, m.email].sort().join('-');
        socket.emit('joinRoom', dmRoom);
      }
    });
  }, [socket]);

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
      unreadCounts, totalUnreadCount, messagesStore, socket, activeChatKey,
      incrementUnread, clearUnread, setMessages, addMessage, setActiveChatKey, initProjectChat,
      simulateNoti
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
