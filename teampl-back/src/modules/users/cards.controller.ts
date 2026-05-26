import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { prisma } from '../../prisma';

const router = Router();
router.use(authMiddleware);

// 카드사 자동 감지
const detectCardCompany = (number: string): string => {
  const clean = number.replace(/\s/g, '');
  if (clean.startsWith('4')) return '비자(VISA)';
  if (clean.startsWith('5') || clean.startsWith('2')) return '마스터카드';
  if (clean.startsWith('3')) return '아멕스(AMEX)';
  if (clean.startsWith('9')) return '국민카드';
  if (clean.startsWith('6')) return '신한카드';
  if (clean.startsWith('7')) return '현대카드';
  if (clean.startsWith('8')) return '우리카드';
  return '기타';
};

// GET /api/users/cards - 등록된 카드 목록 조회
router.get('/', async (req: Request, res: Response) => {
  try {
    const userEmail = req.user!.email;
    const cards = await prisma.paymentCard.findMany({
      where: { userEmail },
      orderBy: { createdAt: 'desc' },
    });
    res.json(cards);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/users/cards - 카드 등록
router.post('/', async (req: Request, res: Response) => {
  try {
    const userEmail = req.user!.email;
    const userId = req.user!.id;
    const { cardNumber, expiryMonth, expiryYear, cardHolder } = req.body;

    if (!cardNumber || !expiryMonth || !expiryYear || !cardHolder) {
      return res.status(400).json({ message: '모든 카드 정보를 입력해주세요.' });
    }

    // 번호 마스킹: 마지막 4자리만 유지
    const cleanNumber = cardNumber.replace(/\s/g, '');
    const last4 = cleanNumber.slice(-4);
    const maskedNumber = `**** **** **** ${last4}`;
    const cardCompany = detectCardCompany(cleanNumber);

    // 카드 저장
    const card = await prisma.paymentCard.create({
      data: {
        userEmail,
        cardCompany,
        maskedNumber,
        expiryMonth,
        expiryYear,
        cardHolder,
      },
    });

    // PRO 플랜으로 자동 업그레이드
    await prisma.user.update({
      where: { id: userId },
      data: { plan: 'PRO' },
    });

    res.status(201).json({ card, message: 'PRO 플랜으로 업그레이드되었습니다!' });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// DELETE /api/users/cards/:cardId - 카드 삭제
router.delete('/:cardId', async (req: Request, res: Response) => {
  try {
    const userEmail = req.user!.email;
    const userId = req.user!.id;
    const cardId = parseInt(req.params.cardId as string, 10);

    const card = await prisma.paymentCard.findUnique({ where: { id: cardId } });
    if (!card || card.userEmail !== userEmail) {
      return res.status(404).json({ message: '카드를 찾을 수 없습니다.' });
    }

    await prisma.paymentCard.delete({ where: { id: cardId } });

    // 카드가 하나도 없으면 FREE로 다운그레이드
    const remainingCards = await prisma.paymentCard.count({ where: { userEmail } });
    if (remainingCards === 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { plan: 'FREE' },
      });
    }

    const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
    const { password: _, ...userWithoutPassword } = updatedUser!;

    res.json({ message: '카드가 삭제되었습니다.', user: userWithoutPassword, remainingCards });
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
