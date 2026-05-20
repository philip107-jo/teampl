import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { VotesService } from './votes.service';

const router = Router({ mergeParams: true });
router.use(authMiddleware);

// GET /api/projects/:projectId/votes
router.get('/', async (req: Request<{ projectId: string }>, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const votes = await VotesService.getVotes(projectId, req.user!.email);
    res.json(votes);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/projects/:projectId/votes
router.post('/', async (req: Request<{ projectId: string }>, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const vote = await VotesService.createVote(projectId, req.user!.email, req.body);
    res.status(201).json(vote);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// POST /api/projects/:projectId/votes/:voteId/cast
router.post('/:voteId/cast', async (req: Request<{ projectId: string; voteId: string }>, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const voteId = parseInt(req.params.voteId, 10);
    const { optionIds } = req.body;
    const result = await VotesService.castVote(projectId, voteId, req.user!.email, optionIds);
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

// DELETE /api/projects/:projectId/votes/:voteId
router.delete('/:voteId', async (req: Request<{ projectId: string; voteId: string }>, res: Response) => {
  try {
    const projectId = parseInt(req.params.projectId, 10);
    const voteId = parseInt(req.params.voteId, 10);
    await VotesService.deleteVote(projectId, voteId, req.user!.email);
    res.status(204).send();
  } catch (e: any) {
    res.status(400).json({ message: e.message });
  }
});

export default router;
