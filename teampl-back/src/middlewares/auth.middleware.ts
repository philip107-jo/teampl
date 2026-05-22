import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../common/errors';

import { config } from '../lib/config';
const JWT_SECRET = config.jwt.secret;

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('인증 토큰이 제공되지 않았습니다.');
        }

        const token = authHeader.split(' ')[1];
        
        if (!token) {
            throw new UnauthorizedError('유효하지 않은 토큰 형식입니다.');
        }

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        req.user = decoded;
        
        next();
    } catch (e: any) {
        if (e.name === 'TokenExpiredError') {
            next(new UnauthorizedError('인증 토큰이 만료되었습니다. 다시 로그인해주세요.'));
        } else if (e.name === 'JsonWebTokenError') {
            next(new UnauthorizedError('유효하지 않은 인증 토큰입니다.'));
        } else {
            next(e);
        }
    }
};
