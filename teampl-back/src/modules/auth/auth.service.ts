import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UsersService } from '../users/users.service';
import { ConflictError, UnauthorizedError, BadRequestError } from '../../common/errors';
import { prisma } from '../../prisma';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../lib/email';

import { config } from '../../lib/config';
const JWT_SECRET = config.jwt.secret;

export const AuthService = {
    sendVerificationCode: async (email: string) => {
        const existing = await UsersService.findByEmail(email);
        if (existing) {
            throw new ConflictError('이미 가입된 이메일 주소입니다.');
        }

        // 6자리 난수 코드 생성
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5분 후 만료

        await prisma.emailVerification.upsert({
            where: { email },
            update: {
                code,
                expiresAt,
                isVerified: false,
                createdAt: new Date(),
            },
            create: {
                email,
                code,
                expiresAt,
                isVerified: false,
            },
        });

        await sendVerificationEmail(email, code);
        return { message: '인증 번호가 이메일로 전송되었습니다.' };
    },

    verifyCode: async (email: string, code: string) => {
        const record = await prisma.emailVerification.findUnique({
            where: { email },
        });

        if (!record) {
            throw new BadRequestError('인증 요청 정보가 없습니다. 다시 인증 요청을 해주세요.');
        }

        if (record.code !== code) {
            throw new BadRequestError('인증 번호가 일치하지 않습니다.');
        }

        if (record.expiresAt < new Date()) {
            throw new BadRequestError('인증번호 유효 시간(5분)이 만료되었습니다. 다시 요청해 주세요.');
        }

        await prisma.emailVerification.update({
            where: { email },
            data: { isVerified: true },
        });

        return { message: '이메일 인증이 성공적으로 완료되었습니다.' };
    },

    register: async (email: string, password: string, name?: string, studentId?: string, department?: string) => {
        const existing = await UsersService.findByEmail(email);
        if (existing) {
            throw new ConflictError('User already exists');
        }

        // 회원가입 전 이메일 인증 여부 검증
        const verification = await prisma.emailVerification.findUnique({
            where: { email },
        });

        if (!verification || !verification.isVerified) {
            throw new BadRequestError('이메일 인증이 완료되지 않았습니다.');
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = await UsersService.create({
            email,
            password: hashedPassword,
            name: name || email.split('@')[0],
            studentId,
            department
        });

        // 회원가입 성공 시 인증 레코드 삭제
        await prisma.emailVerification.delete({
            where: { email },
        }).catch((err) => console.error('Failed to delete verification record:', err));
        
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
    },

    sendPasswordResetCode: async (email: string) => {
        const user = await UsersService.findByEmail(email);
        if (!user) {
            throw new BadRequestError('가입된 이메일 주소가 아닙니다.');
        }

        // 6자리 난수 코드 생성
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5분 후 만료

        await prisma.emailVerification.upsert({
            where: { email },
            update: {
                code,
                expiresAt,
                isVerified: false,
                createdAt: new Date(),
            },
            create: {
                email,
                code,
                expiresAt,
                isVerified: false,
            },
        });

        await sendPasswordResetEmail(email, code);
        return { message: '비밀번호 재설정 인증번호가 이메일로 전송되었습니다.' };
    },

    resetPassword: async (email: string, newPassword: string) => {
        const user = await UsersService.findByEmail(email);
        if (!user) {
            throw new BadRequestError('사용자를 찾을 수 없습니다.');
        }

        const verification = await prisma.emailVerification.findUnique({
            where: { email },
        });

        if (!verification || !verification.isVerified) {
            throw new BadRequestError('이메일 인증이 완료되지 않았습니다.');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await UsersService.changePassword(user.id, hashedPassword);

        // 비밀번호 변경 성공 시 인증 레코드 삭제
        await prisma.emailVerification.delete({
            where: { email },
        }).catch((err) => console.error('Failed to delete verification record:', err));

        return { message: '비밀번호가 성공적으로 변경되었습니다.' };
    }
};
