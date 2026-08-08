import { pool } from '../db/pool.js';

const SUPERFICIES = new Set(['totem', 'painel']);

/**
 * Append-only audit log. Requires a transaction client so the business
 * mutation and this insert succeed or fail together (constituição V / FR-011).
 */
export async function registrarLog(client, { acao, superficieAtor, atendimentoId = null, detalhe }) {
  if (!client || typeof client.query !== 'function') {
    throw new Error('registrarLog requires a transaction client (audit must not be silent)');
  }
  if (!SUPERFICIES.has(superficieAtor)) {
    throw new Error("superficieAtor must be 'totem' or 'painel'");
  }
  if (!acao || !detalhe) {
    throw new Error('acao and detalhe are required for audit log');
  }

  await client.query(
    `INSERT INTO eventos_log (superficie_ator, acao, atendimento_id, detalhe)
     VALUES ($1, $2, $3, $4)`,
    [superficieAtor, acao, atendimentoId, detalhe]
  );
}

export async function listarLogs({ limit = 100, acao } = {}) {
  const capped = Math.min(Math.max(Number(limit) || 100, 1), 500);
  const params = [];
  let sql = `SELECT id, ocorrido_em, superficie_ator, acao, atendimento_id, detalhe
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
