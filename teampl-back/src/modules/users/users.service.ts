import { User } from './user.model';

// 임시 메모리 저장소 및 테스트 유저 1명 세팅
let users: User[] = [
    {
        id: 1,
        email: 'test@example.com',
        // 'password123' bcrypt hash
        password: '$2a$10$wLszh0RjMwQZqz6c6SgLx.5kX8fF6Xn6Q/f7xIcLw2rI0jO/p0qM2',
        name: 'Test Tester'
    }
];
let nextId = 2;

export const UsersService = {
  create: (data: Omit<User, 'id'>): User => {
    const newUser: User = { ...data, id: nextId++ };
    users.push(newUser);
    return newUser;
  },
  findByEmail: (email: string): User | undefined => {
    return users.find(u => u.email === email);
  },
  findById: (id: number): User | undefined => {
    return users.find(u => u.id === id);
  }
};
