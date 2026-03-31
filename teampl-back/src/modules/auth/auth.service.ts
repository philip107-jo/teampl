import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UsersService } from '../users/users.service';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export const AuthService = {
    register: async (email: string, password: string, name?: string) => {
        const existing = UsersService.findByEmail(email);
        if (existing) {
            throw new Error('User already exists');
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = UsersService.create({
            email,
            password: hashedPassword,
            name: name || email.split('@')[0],
        });
        
        const { password: _, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    },
    
    login: async (email: string, password: string) => {
        const user = UsersService.findByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email }, 
            JWT_SECRET, 
            { expiresIn: '1d' }
        );
        
        const { password: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }
}
