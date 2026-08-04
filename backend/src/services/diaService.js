import { withTransaction } from '../db/pool.js';
import { getDiaAberto } from './atendimentoService.js';
import { registrarLog } from './logService.js';

export async function getDiaAtual() {
  return getDiaAberto();
}

export async function encerrarAbrir() {
  return withTransaction(async (client) => {
    const atual = await getDiaAberto(client);

    await client.query(
      `UPDATE dias_operacionais
       SET status = 'fechado', fechado_em = NOW()
       WHERE id = $1`,
      [atual.id]
    );

    const novo = await client.query(
      `INSERT INTO dias_operacionais (status, aberto_em)
       VALUES ('aberto', NOW())
       RETURNING id, status, aberto_em, fechado_em`
    );

    await registrarLog(client, {
      acao: 'ENCERRAR_ABRIR_DIA',
      detalhe: `Dia ${atual.id} fechado; novo dia ${novo.rows[0].id} aberto`,
    });

    return {
      dia_anterior: { ...atual, status: 'fechado', fechado_em: new Date().toISOString() },
      dia_atual: novo.rows[0],
    };
  });
}
