import { api } from '../shared/api.js';

const formEmitir = document.getElementById('form-emitir');
const formConsultar = document.getElementById('form-consultar');
const tipoSelect = document.getElementById('tipo');
const cTipo = document.getElementById('c-tipo');
const emitMsg = document.getElementById('emit-msg');
const emitResult = document.getElementById('emit-result');
const consultaMsg = document.getElementById('consulta-msg');
const consultaResult = document.getElementById('consulta-result');

function showMsg(el, text, ok = false) {
  el.innerHTML = text
    ? `<div class="msg ${ok ? 'ok' : 'error'}">${text}</div>`
    : '';
}

async function loadExames() {
  const { data } = await api('/exames');
  const options = data
    .map((e) => `<option value="${e.codigo}">${e.nome}</option>`)
    .join('');
  tipoSelect.innerHTML = `<option value="">Selecione...</option>${options}`;
  cTipo.innerHTML = options;
}

document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const name = tab.dataset.tab;
    document.getElementById('panel-emitir').hidden = name !== 'emitir';
    document.getElementById('panel-consultar').hidden = name !== 'consultar';
  });
});

formEmitir.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  showMsg(emitMsg, '');
  emitResult.hidden = true;
  const fd = new FormData(formEmitir);
  try {
    const { data } = await api('/atendimentos', {
      method: 'POST',
      body: JSON.stringify({
        nome_completo: fd.get('nome_completo'),
        documento: fd.get('documento'),
        tipo_exame_codigo: fd.get('tipo_exame_codigo'),
      }),
    });
    document.getElementById('senha-num').textContent = String(data.numero_senha).padStart(3, '0');
    document.getElementById('senha-tipo').textContent = data.tipo_exame.nome;
    emitResult.hidden = false;
    showMsg(emitMsg, 'Senha emitida. Aguarde a chamada.', true);
    formEmitir.reset();
    await loadExames();
  } catch (err) {
    showMsg(emitMsg, err.message);
  }
});

formConsultar.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  showMsg(consultaMsg, '');
  consultaResult.hidden = true;
  const params = new URLSearchParams({
    tipo_exame_codigo: cTipo.value,
    numero_senha: document.getElementById('c-senha').value,
  });
  const doc = document.getElementById('c-doc').value.trim();
  if (doc) params.set('documento', doc);

  try {
    const { data } = await api(`/atendimentos/consulta?${params}`);
    const resultadoTxt = data.resultado_disponivel
      ? data.resultado
      : 'Resultado ainda não disponível';
    consultaResult.innerHTML = `
      <p><strong>Senha</strong> ${String(data.numero_senha).padStart(3, '0')} · ${data.tipo_exame.nome}</p>
      <p><strong>Nome</strong> ${data.nome_completo}</p>
      <p><strong>Status</strong> ${data.status} · <span class="badge ${data.prioridade}">${data.prioridade}</span></p>
      <p><strong>Resultado</strong> ${resultadoTxt}</p>
    `;
    consultaResult.hidden = false;
  } catch (err) {
    showMsg(consultaMsg, err.message);
  }
});

loadExames().catch((err) => showMsg(emitMsg, err.message));
