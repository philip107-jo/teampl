import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UsersService } from '../users/users.service';
import { ConflictError, UnauthorizedError } from '../../common/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

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
    }
}
