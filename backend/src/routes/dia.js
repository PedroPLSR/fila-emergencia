import { Router } from 'express';
import * as diaService from '../services/diaService.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const data = await diaService.getDiaAtual();
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post('/encerrar-abrir', async (_req, res, next) => {
  try {
    const data = await diaService.encerrarAbrir();
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
