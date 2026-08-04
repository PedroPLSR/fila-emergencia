import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, codigo, nome, ativo FROM tipos_exame WHERE ativo = TRUE ORDER BY nome`
    );
    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
