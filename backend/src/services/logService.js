import { pool } from '../db/pool.js';

export async function registrarLog(clientOrNull, { acao, atendimentoId = null, detalhe }) {
  const runner = clientOrNull || pool;
  await runner.query(
    `INSERT INTO eventos_log (acao, atendimento_id, detalhe)
     VALUES ($1, $2, $3)`,
    [acao, atendimentoId, detalhe]
  );
}

export async function listarLogs({ limit = 100, acao } = {}) {
  const capped = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const params = [];
  let sql = `SELECT id, ocorrido_em, acao, atendimento_id, detalhe
             FROM eventos_log`;
  if (acao) {
    params.push(acao);
    sql += ` WHERE acao = $${params.length}`;
  }
  params.push(capped);
  sql += ` ORDER BY ocorrido_em DESC LIMIT $${params.length}`;
  const { rows } = await pool.query(sql, params);
  return rows;
}
