import { Router } from 'express';
import * as filaService from '../services/filaService.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const data = await filaService.listarFilas(req.query.tipo_exame_codigo);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post('/:tipoExameCodigo/proximo', async (req, res, next) => {
  try {
    const data = await filaService.chamarProximo(req.params.tipoExameCodigo);
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
