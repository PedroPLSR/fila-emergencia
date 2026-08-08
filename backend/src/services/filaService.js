import { pool, withTransaction } from '../db/pool.js';
import { AppError } from '../middleware/errors.js';
import { getDiaAberto } from './atendimentoService.js';
import { registrarLog } from './logService.js';

function mapRow(row) {
  return {
    id: row.id,
    numero_senha: row.numero_senha,
    nome_completo: row.nome_completo,
    documento: row.documento,
    prioridade: row.prioridade,
    status: row.status,
    resultado: row.resultado,
    tipo_exame: {
      id: row.tipo_exame_id,
      codigo: row.tipo_codigo,
      nome: row.tipo_nome,
      ativo: row.tipo_ativo,
    },
    dia_operacional_id: row.dia_operacional_id,
    created_at: row.created_at,
    chamado_em: row.chamado_em,
    concluido_em: row.concluido_em,
  };
}

export async function listarFilas(tipoExameCodigo) {
  const dia = await getDiaAberto();
  const tipos = await pool.query(
    `SELECT id, codigo, nome, ativo FROM tipos_exame WHERE ativo = TRUE ${
      tipoExameCodigo ? 'AND codigo = $1' : ''
    } ORDER BY nome`,
    tipoExameCodigo ? [tipoExameCodigo] : []
  );

  const result = [];
  for (const tipo of tipos.rows) {
    const { rows } = await pool.query(
      `SELECT a.*,
              t.id AS tipo_exame_id, t.codigo AS tipo_codigo, t.nome AS tipo_nome, t.ativo AS tipo_ativo
       FROM atendimentos a
       JOIN tipos_exame t ON t.id = a.tipo_exame_id
       WHERE a.dia_operacional_id = $1
         AND a.tipo_exame_id = $2
         AND a.status = 'aguardando'
       ORDER BY CASE a.prioridade WHEN 'urgente' THEN 0 ELSE 1 END, a.created_at ASC`,
      [dia.id, tipo.id]
    );

    const urgentes = rows.filter((r) => r.prioridade === 'urgente').length;
    result.push({
      tipo_exame: {
        id: tipo.id,
        codigo: tipo.codigo,
        nome: tipo.nome,
        ativo: tipo.ativo,
      },
      aguardando: rows.length,
      urgentes_aguardando: urgentes,
      proximos: rows.slice(0, 10).map(mapRow),
    });
  }

  return result;
}

export async function chamarProximo(tipoExameCodigo) {
  return withTransaction(async (client) => {
    const dia = await getDiaAberto(client);
    const tipoRes = await client.query(
      `SELECT id, codigo, nome, ativo FROM tipos_exame WHERE codigo = $1`,
      [tipoExameCodigo]
    );
    const tipo = tipoRes.rows[0];
    if (!tipo) {
      throw new AppError(404, 'NOT_FOUND', 'Tipo de exame inexistente');
    }

    const pick = await client.query(
      `SELECT a.id
       FROM atendimentos a
       WHERE a.dia_operacional_id = $1
         AND a.tipo_exame_id = $2
         AND a.status = 'aguardando'
       ORDER BY CASE a.prioridade WHEN 'urgente' THEN 0 ELSE 1 END, a.created_at ASC
       FOR UPDATE SKIP LOCKED
       LIMIT 1`,
      [dia.id, tipo.id]
    );

    if (!pick.rows[0]) {
      throw new AppError(404, 'QUEUE_EMPTY', 'Não há ninguém aguardando nesta fila');
    }

    const id = pick.rows[0].id;
    const updated = await client.query(
      `UPDATE atendimentos
       SET status = 'chamado', chamado_em = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    await registrarLog(client, {
      acao: 'CHAMAR_PROXIMO',
      superficieAtor: 'painel',
      atendimentoId: id,
      detalhe: `Chamado senha ${updated.rows[0].numero_senha} (${tipo.codigo})`,
    });

    return mapRow({
      ...updated.rows[0],
      tipo_exame_id: tipo.id,
      tipo_codigo: tipo.codigo,
      tipo_nome: tipo.nome,
      tipo_ativo: tipo.ativo,
    });
  });
}
