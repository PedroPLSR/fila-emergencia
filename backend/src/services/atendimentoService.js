import { pool, withTransaction } from '../db/pool.js';
import { AppError } from '../middleware/errors.js';
import { registrarLog } from './logService.js';

const ALLOWED_TRANSITIONS = {
  aguardando: ['chamado', 'cancelado'],
  chamado: ['em_atendimento', 'cancelado', 'aguardando'],
  em_atendimento: ['concluido', 'cancelado'],
  concluido: [],
  cancelado: [],
};

function mapAtendimento(row) {
  if (!row) return null;
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

const ATENDIMENTO_SELECT = `
  SELECT a.*,
         t.id AS tipo_exame_id,
         t.codigo AS tipo_codigo,
         t.nome AS tipo_nome,
         t.ativo AS tipo_ativo
  FROM atendimentos a
  JOIN tipos_exame t ON t.id = a.tipo_exame_id
`;

export async function getDiaAberto(client = pool) {
  const { rows } = await client.query(
    `SELECT id, status, aberto_em, fechado_em
     FROM dias_operacionais WHERE status = 'aberto' LIMIT 1`
  );
  if (!rows[0]) {
    throw new AppError(409, 'NO_OPEN_DAY', 'Nenhum dia operacional aberto');
  }
  return rows[0];
}

export async function emitirSenha({ nome_completo, documento, tipo_exame_codigo }) {
  const nome = (nome_completo || '').trim();
  const doc = (documento || '').trim();
  const codigo = (tipo_exame_codigo || '').trim();

  if (!nome || !doc) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Nome completo e documento são obrigatórios'
    );
  }
  if (!codigo) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Tipo de exame é obrigatório');
  }

  return withTransaction(async (client) => {
    const dia = await getDiaAberto(client);
    const tipoRes = await client.query(
      `SELECT id, codigo, nome, ativo FROM tipos_exame WHERE codigo = $1`,
      [codigo]
    );
    const tipo = tipoRes.rows[0];
    if (!tipo || !tipo.ativo) {
      throw new AppError(400, 'EXAM_UNAVAILABLE', 'Tipo de exame indisponível ou inexistente');
    }

    const nextRes = await client.query(
      `SELECT COALESCE(MAX(numero_senha), 0) + 1 AS next
       FROM atendimentos
       WHERE dia_operacional_id = $1 AND tipo_exame_id = $2`,
      [dia.id, tipo.id]
    );
    const numero = Number(nextRes.rows[0].next);

    const insert = await client.query(
      `INSERT INTO atendimentos
         (dia_operacional_id, tipo_exame_id, numero_senha, nome_completo, documento, prioridade, status)
       VALUES ($1, $2, $3, $4, $5, 'rotina', 'aguardando')
       RETURNING *`,
      [dia.id, tipo.id, numero, nome, doc]
    );

    const row = {
      ...insert.rows[0],
      tipo_exame_id: tipo.id,
      tipo_codigo: tipo.codigo,
      tipo_nome: tipo.nome,
      tipo_ativo: tipo.ativo,
    };

    await registrarLog(client, {
      acao: 'EMITIR_SENHA',
      superficieAtor: 'totem',
      atendimentoId: row.id,
      detalhe: `Senha ${numero} emitida para ${tipo.codigo} (${nome})`,
    });

    return mapAtendimento(row);
  });
}

export async function alterarPrioridade(id, prioridade) {
  if (!['rotina', 'urgente'].includes(prioridade)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Prioridade deve ser rotina ou urgente');
  }

  return withTransaction(async (client) => {
    const { rows } = await client.query(`${ATENDIMENTO_SELECT} WHERE a.id = $1 FOR UPDATE OF a`, [
      id,
    ]);
    const current = rows[0];
    if (!current) throw new AppError(404, 'NOT_FOUND', 'Atendimento não encontrado');
    if (current.status !== 'aguardando') {
      throw new AppError(
        409,
        'INVALID_STATE',
        'Só é possível alterar prioridade de atendimentos aguardando'
      );
    }

    const from = current.prioridade;
    const updated = await client.query(
      `UPDATE atendimentos
       SET prioridade = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [prioridade, id]
    );

    await registrarLog(client, {
      acao: 'PRIORIZAR',
      superficieAtor: 'painel',
      atendimentoId: id,
      detalhe: `Prioridade ${from} → ${prioridade} (senha ${current.numero_senha})`,
    });

    const row = {
      ...updated.rows[0],
      tipo_exame_id: current.tipo_exame_id,
      tipo_codigo: current.tipo_codigo,
      tipo_nome: current.tipo_nome,
      tipo_ativo: current.tipo_ativo,
    };
    return mapAtendimento(row);
  });
}

export async function atualizarStatus(id, { status, resultado = null }) {
  const known = Object.keys(ALLOWED_TRANSITIONS);
  if (!known.includes(status)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Status inválido');
  }

  return withTransaction(async (client) => {
    const { rows } = await client.query(`${ATENDIMENTO_SELECT} WHERE a.id = $1 FOR UPDATE OF a`, [
      id,
    ]);
    const current = rows[0];
    if (!current) throw new AppError(404, 'NOT_FOUND', 'Atendimento não encontrado');

    const allowed = ALLOWED_TRANSITIONS[current.status] || [];
    if (!allowed.includes(status)) {
      throw new AppError(
        409,
        'INVALID_STATE',
        `Transição de ${current.status} para ${status} não permitida`
      );
    }

    const chamadoEm =
      status === 'chamado' ? new Date().toISOString() : current.chamado_em;
    const concluidoEm =
      status === 'concluido' || status === 'cancelado'
        ? new Date().toISOString()
        : current.concluido_em;

    const updated = await client.query(
      `UPDATE atendimentos
       SET status = $1,
           resultado = COALESCE($2, resultado),
           chamado_em = $3,
           concluido_em = $4,
           updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [status, resultado, chamadoEm, concluidoEm, id]
    );

    await registrarLog(client, {
      acao: 'ATUALIZAR_STATUS',
      superficieAtor: 'painel',
      atendimentoId: id,
      detalhe: `Status ${current.status} → ${status}${resultado ? ` (resultado: ${resultado})` : ''}`,
    });

    const row = {
      ...updated.rows[0],
      tipo_exame_id: current.tipo_exame_id,
      tipo_codigo: current.tipo_codigo,
      tipo_nome: current.tipo_nome,
      tipo_ativo: current.tipo_ativo,
    };
    return mapAtendimento(row);
  });
}

export async function consultar({ tipo_exame_codigo, numero_senha, documento }) {
  const codigo = (tipo_exame_codigo || '').trim();
  const numero = Number(numero_senha);
  if (!codigo || !Number.isInteger(numero) || numero < 1) {
    throw new AppError(400, 'VALIDATION_ERROR', 'tipo_exame_codigo e numero_senha são obrigatórios');
  }

  const params = [codigo, numero];
  let sql = `${ATENDIMENTO_SELECT}
    JOIN dias_operacionais d ON d.id = a.dia_operacional_id
    WHERE t.codigo = $1 AND a.numero_senha = $2`;

  if (documento && String(documento).trim()) {
    params.push(String(documento).trim());
    sql += ` AND a.documento = $${params.length}`;
  }

  sql += ` ORDER BY a.created_at DESC LIMIT 1`;

  const { rows } = await pool.query(sql, params);
  if (!rows[0]) {
    throw new AppError(404, 'NOT_FOUND', 'Senha inválida ou não encontrada para o tipo informado');
  }

  const mapped = mapAtendimento(rows[0]);
  return {
    ...mapped,
    resultado_disponivel: Boolean(mapped.resultado),
  };
}
