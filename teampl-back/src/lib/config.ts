import dotenv from 'dotenv';
dotenv.config();

export const config = {
    jwt: {
        secret: process.env.JWT_SECRET || 'fallback-secret-key-do-not-use-in-production',
        expiresIn: '7d',
    },
    vapid: {
        publicKey: process.env.VAPID_PUBLIC_KEY || 'BM2x5B4BqOEKuFpXJ27Zl75BwX8qA5zY79x6H-02q7x7X9XyX7XyX7XyX7XyX7XyX7XyX7XyX7XyX7XyX7XyX7Q',
        privateKey: process.env.VAPID_PRIVATE_KEY || 'do-not-use-this-in-production-configure-env',
        subject: 'mailto:admin@teampl.com',
    },
    email: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASS || '',
    }
};
