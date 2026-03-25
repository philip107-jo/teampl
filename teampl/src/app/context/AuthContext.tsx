import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { currentUser as mockUser } from '../mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  register: (userData: any) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 로컬 스토리지에서 세션 확인 (모의 구현)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const register = async (userData: any) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        if (users.find((u: any) => u.email === userData.email)) {
          reject(new Error('이미 가입된 이메일입니다.'));
          return;
        }
        users.push({ ...userData, id: `user-${Date.now()}`, isTestUser: false });
        localStorage.setItem('registeredUsers', JSON.stringify(users));
        resolve();
      }, 500);
    });
  };

  const login = async (email: string, password?: string) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (email === 'test@naver.com' && password === '1234') {
          const userData = { ...mockUser, email, isTestUser: true };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          resolve();
        } else {
          const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
          const foundUser = users.find((u: any) => u.email === email && u.password === password);

          if (foundUser) {
            // Remove sensitive info before putting in session
            const { password, passwordConfirm, ...safeUserData } = foundUser;
            setUser(safeUserData);
            localStorage.setItem('user', JSON.stringify(safeUserData));
            resolve();
          } else {
            reject(new Error('이메일 또는 비밀번호가 올바르지 않거나 가입되지 않은 계정입니다.'));
          }
        }
      }, 500);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const updateProfile = async (updatedData: Partial<User>) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        if (!user) return resolve();
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));

        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const index = users.findIndex((u: any) => u.email === user.email);
        if (index !== -1) {
          users[index] = { ...users[index], ...updatedData };
          localStorage.setItem('registeredUsers', JSON.stringify(users));
        }

        resolve();
      }, 300);
    });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, register, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
