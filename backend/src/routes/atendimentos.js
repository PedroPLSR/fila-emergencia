import { Router } from 'express';
import * as atendimentoService from '../services/atendimentoService.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const data = await atendimentoService.emitirSenha(req.body || {});
    res.status(201).json({ data });
  } catch (err) {
    next(err);
  }
});

router.get('/consulta', async (req, res, next) => {
  try {
    const data = await atendimentoService.consultar({
      tipo_exame_codigo: req.query.tipo_exame_codigo,
      numero_senha: req.query.numero_senha,
      documento: req.query.documento,
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/prioridade', async (req, res, next) => {
  try {
    const data = await atendimentoService.alterarPrioridade(
      req.params.id,
      req.body?.prioridade
    );
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const data = await atendimentoService.atualizarStatus(req.params.id, {
      status: req.body?.status,
      resultado: req.body?.resultado ?? null,
    });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

export default router;
