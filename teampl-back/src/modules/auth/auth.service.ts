import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UsersService } from '../users/users.service';
import { ConflictError, UnauthorizedError } from '../../common/errors';

import { config } from '../../lib/config';
const JWT_SECRET = config.jwt.secret;

export const AuthService = {
    register: async (email: string, password: string, name?: string) => {
        const existing = await UsersService.findByEmail(email);
        if (existing) {
            throw new ConflictError('User already exists');
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = await UsersService.create({
            email,
            password: hashedPassword,
            name: name || email.split('@')[0],
        });
        
        const { password: _, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    },
    
    login: async (email: string, password: string) => {
        const user = await UsersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedError('존재하지 않는 아이디 입니다!');
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new UnauthorizedError('비밀번호가 일치하지 않습니다.');
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email }, 
            JWT_SECRET, 
            { expiresIn: '30d' }
        );
        
        const { password: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    },

    changePassword: async (userId: string, currentPassword: string, newPassword: string) => {
        const user = await UsersService.findById(userId);
        if (!user) {
            throw new UnauthorizedError('사용자를 찾을 수 없습니다.');
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            throw new UnauthorizedError('현재 비밀번호가 일치하지 않습니다.');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await UsersService.changePassword(userId, hashedPassword);

        return { message: '비밀번호가 성공적으로 변경되었습니다.' };
    }
}
