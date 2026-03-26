import { Router } from 'express';
import { AuthService } from './auth.service';

const router = Router();

router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        const result = await AuthService.register(email, password, name);
        res.status(201).json(result);
    } catch (error: any) {
        if (error.message === 'User already exists') {
            return res.status(409).json({ message: error.message });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        const result = await AuthService.login(email, password);
        res.json(result);
    } catch (error: any) {
        if (error.message === 'Invalid credentials') {
            return res.status(401).json({ message: error.message });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
