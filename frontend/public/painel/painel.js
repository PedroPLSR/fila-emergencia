import { api } from '../shared/api.js';

const filtroTipo = document.getElementById('filtro-tipo');
const filaLista = document.getElementById('fila-lista');
const filaResumo = document.getElementById('fila-resumo');
const detalhe = document.getElementById('detalhe');
const detalheActions = document.getElementById('detalhe-actions');
const diaInfo = document.getElementById('dia-info');
const logsEl = document.getElementById('logs');
const globalMsg = document.getElementById('global-msg');

let selected = null;
let filasCache = [];

function showMsg(text, ok = false) {
  globalMsg.innerHTML = text
    ? `<div class="msg ${ok ? 'ok' : 'error'}">${text}</div>`
    : '';
}

function pad(n) {
  return String(n).padStart(3, '0');
}

async function loadDia() {
  const { data } = await api('/dia');
  diaInfo.textContent = `Dia aberto desde ${new Date(data.aberto_em).toLocaleString('pt-BR')}`;
}

async function loadExames() {
  const { data } = await api('/exames');
  filtroTipo.innerHTML = data
    .map((e) => `<option value="${e.codigo}">${e.nome}</option>`)
    .join('');
}

async function loadFilas() {
  const codigo = filtroTipo.value;
  const qs = codigo ? `?tipo_exame_codigo=${encodeURIComponent(codigo)}` : '';
  const { data } = await api(`/filas${qs}`);
  filasCache = data;

  const current =
    data.find((f) => f.tipo_exame.codigo === codigo) || data[0];
  if (!current) {
    filaResumo.textContent = 'Nenhuma fila.';
    filaLista.innerHTML = '';
    return;
  }

  if (!codigo) filtroTipo.value = current.tipo_exame.codigo;

  filaResumo.textContent = `${current.tipo_exame.nome}: ${current.aguardando} aguardando (${current.urgentes_aguardando} urgentes)`;
  filaLista.innerHTML = current.proximos
    .map(
      (a) => `
      <div class="item ${selected?.id === a.id ? 'selected' : ''}" data-id="${a.id}">
        <div class="senha">${pad(a.numero_senha)} <span class="badge ${a.prioridade}">${a.prioridade}</span></div>
        <div>${a.nome_completo}</div>
        <div class="muted">${a.documento} · ${a.status}</div>
      </div>`
    )
    .join('') || '<p class="muted">Fila vazia.</p>';

  filaLista.querySelectorAll('.item').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      selected = current.proximos.find((a) => a.id === id) || null;
      renderDetalhe();
      loadFilas();
    });
  });
}

function renderDetalhe() {
  if (!selected) {
    detalhe.textContent = 'Selecione um item na fila.';
    detalheActions.hidden = true;
    return;
  }
  detalhe.innerHTML = `
    <p><strong>Senha</strong> ${pad(selected.numero_senha)}</p>
    <p><strong>Nome</strong> ${selected.nome_completo}</p>
    <p><strong>Documento</strong> ${selected.documento}</p>
    <p><strong>Tipo</strong> ${selected.tipo_exame.nome}</p>
    <p><strong>Status</strong> ${selected.status} · <span class="badge ${selected.prioridade}">${selected.prioridade}</span></p>
  `;
  detalheActions.hidden = false;
}

async function loadLogs() {
  const { data } = await api('/logs?limit=50');
  logsEl.innerHTML = data
    .map(
      (l) => `
      <div class="log-line">
        <time>${new Date(l.ocorrido_em).toLocaleString('pt-BR')}</time>
        <strong>${l.acao}</strong> — ${l.detalhe}
      </div>`
    )
    .join('') || '<p class="muted">Sem eventos.</p>';
}

async function refreshAll() {
  showMsg('');
  await loadDia();
  await loadFilas();
  await loadLogs();
}

document.getElementById('btn-refresh').addEventListener('click', () => {
  refreshAll().catch((e) => showMsg(e.message));
});

filtroTipo.addEventListener('change', () => {
  selected = null;
  renderDetalhe();
  loadFilas().catch((e) => showMsg(e.message));
});

document.getElementById('btn-proximo').addEventListener('click', async () => {
  try {
    const { data } = await api(`/filas/${encodeURIComponent(filtroTipo.value)}/proximo`, {
      method: 'POST',
    });
    selected = data;
    showMsg(`Chamado: senha ${pad(data.numero_senha)} — ${data.nome_completo}`, true);
    renderDetalhe();
    await refreshAll();
  } catch (err) {
    showMsg(err.message);
  }
});

document.getElementById('btn-urgente').addEventListener('click', async () => {
  if (!selected) return;
  try {
    const { data } = await api(`/atendimentos/${selected.id}/prioridade`, {
      method: 'PATCH',
      body: JSON.stringify({ prioridade: 'urgente' }),
    });
    selected = data;
    showMsg('Marcado como urgente.', true);
    await refreshAll();
    renderDetalhe();
  } catch (err) {
    showMsg(err.message);
  }
});

document.getElementById('btn-rotina').addEventListener('click', async () => {
  if (!selected) return;
  try {
    const { data } = await api(`/atendimentos/${selected.id}/prioridade`, {
      method: 'PATCH',
      body: JSON.stringify({ prioridade: 'rotina' }),
    });
    selected = data;
    showMsg('Marcado como rotina.', true);
    await refreshAll();
    renderDetalhe();
  } catch (err) {
    showMsg(err.message);
  }
});

detalheActions.querySelectorAll('[data-status]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    if (!selected) return;
    const status = btn.dataset.status;
    const resultado =
      status === 'concluido'
        ? document.getElementById('resultado').value || null
        : null;
    try {
      const { data } = await api(`/atendimentos/${selected.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, resultado }),
      });
      selected = data;
      showMsg(`Status atualizado para ${status}.`, true);
      await refreshAll();
      renderDetalhe();
    } catch (err) {
      showMsg(err.message);
    }
  });
});

document.getElementById('btn-dia').addEventListener('click', async () => {
  if (!confirm('Encerrar o dia atual e abrir um novo? Quem ainda aguarda fica fora da fila ativa.')) {
    return;
  }
  try {
    await api('/dia/encerrar-abrir', { method: 'POST' });
    selected = null;
    renderDetalhe();
    showMsg('Novo dia operacional aberto. Numeração reiniciada.', true);
    await refreshAll();
  } catch (err) {
    showMsg(err.message);
  }
});

(async () => {
  try {
    await loadExames();
    await refreshAll();
  } catch (err) {
    showMsg(err.message);
  }
})();
