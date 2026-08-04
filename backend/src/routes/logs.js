import { Router } from 'express';
import { listarLogs } from '../services/logService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const data = await listarLogs({
      limit: req.query.limit,
      acao: req.query.acao,
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
