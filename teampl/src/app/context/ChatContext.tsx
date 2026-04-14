import React, { createContext, useContext, useState, useMemo } from 'react';

interface ChatContextType {
  unreadCounts: Record<string, number>;
  totalUnreadCount: number;
  incrementUnread: (key: string, amount?: number) => void;
  clearUnread: (key: string) => void;
  simulateNoti: (keys: string[]) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const totalUnreadCount = useMemo(() => {
    return Object.values(unreadCounts).reduce((acc, curr) => acc + curr, 0);
  }, [unreadCounts]);

  const incrementUnread = (key: string, amount: number = 1) => {
    setUnreadCounts(prev => ({
      ...prev,
      [key]: (prev[key] || 0) + amount
    }));
  };

  const clearUnread = (key: string) => {
    if (unreadCounts[key]) {
      setUnreadCounts(prev => ({ ...prev, [key]: 0 }));
    }
  };

  const simulateNoti = (keys: string[]) => {
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const amount = Math.random() > 0.5 ? 1 : 1200;
    incrementUnread(randomKey, amount);
  };

  return (
    <ChatContext.Provider value={{ unreadCounts, totalUnreadCount, incrementUnread, clearUnread, simulateNoti }}>
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
