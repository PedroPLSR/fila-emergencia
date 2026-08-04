# Quickstart: Fila de Emergência (Docker)

**Feature**: `001-fila-emergencia-sangue`  
**Date**: 2026-08-04

Guia de validação ponta a ponta na máquina local. Stack e contratos: [plan.md](./plan.md), [data-model.md](./data-model.md), [contracts/openapi.yaml](./contracts/openapi.yaml).

## Prerequisites

- Docker Desktop instalado e **em execução** (Windows)
- Portas livres: `8080` (web), `3000` (api), `5432` (postgres) — ajustáveis no `.env` se necessário
- Clone do repositório na branch `001-fila-emergencia-sangue`

## Setup

Na raiz do repositório:

```bash
cp .env.example .env
docker compose up --build -d
```

Aguardar healthy dos serviços (`db`, `api`, `web`). Conferir:

```bash
docker compose ps
docker compose logs -f api
```

URLs esperadas (após implementação):

| Superfície | URL |
|------------|-----|
| Totem | http://localhost:8080/totem/ |
| Painel | http://localhost:8080/painel/ |
| API | http://localhost:3000/api/ |

## Validation scenarios

### 1. Emitir senha (P1)

1. Abrir o totem.
2. Informar nome completo + documento; escolher tipo (ex.: Coleta de sangue).
3. Confirmar.

**Esperado**: número de senha do dia/tipo; registro na fila; sem ações de priorizar/chamar no totem.

### 2. Priorizar e chamar (P1/P2)

1. Emitir 2–3 senhas de rotina no mesmo tipo; marcar uma como **urgente** no painel.
2. Clicar **Chamar próximo**.

**Esperado**: o urgente é chamado antes; dentro do mesmo nível, ordem de chegada (FIFO).

### 3. Consulta de status/resultado (P3)

1. No painel, avançar status até concluir com resultado `apto` ou `inapto`.
2. No totem, consultar pela senha (+ tipo).

**Esperado**: status/resultado visíveis; se sem resultado, mensagem de “ainda indisponível”.

### 4. Encerrar/abrir dia (P2)

1. Deixar ao menos um atendimento `aguardando`.
2. No painel, executar **Encerrar/abrir dia**.
3. Emitir nova senha no mesmo tipo.

**Esperado**: numeração recomeça; quem aguardava no dia anterior **não** aparece na fila ativa; histórico/logs registram o evento.

### 5. Logs (P3)

1. Após os passos acima, abrir monitoramento de logs no painel.

**Esperado**: entradas para emissão, priorização, chamada, mudança de status e encerrar/abrir dia.

### 6. Campos obrigatórios

1. No totem, tentar emitir sem nome ou sem documento.

**Esperado**: bloqueio com indicação dos campos faltantes (sem criar senha).

## API smoke (opcional)

Com a API no ar:

```bash
curl -s http://localhost:3000/api/exames
curl -s -X POST http://localhost:3000/api/atendimentos \
  -H "Content-Type: application/json" \
  -d "{\"nome_completo\":\"Maria Silva\",\"documento\":\"12345678900\",\"tipo_exame_codigo\":\"coleta_sangue\"}"
```

Contratos completos: [contracts/openapi.yaml](./contracts/openapi.yaml).

## Tear down

```bash
docker compose down
```

Para apagar volume do banco:

```bash
docker compose down -v
```

## Success checklist (quick)

- [ ] `docker compose up` sobe db + api + web sem erro
- [ ] Totem emite senha em < 1 min no fluxo feliz
- [ ] Urgente chamado antes de rotina
- [ ] Encerrar/abrir dia reinicia numeração e isola espera do dia anterior
- [ ] Logs exibem ações críticas da demonstração
