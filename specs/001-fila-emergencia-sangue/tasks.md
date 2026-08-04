# Tasks: Fila de Emergência para Coleta e Exame de Sangue

**Input**: Design documents from `/specs/001-fila-emergencia-sangue/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Não solicitados na spec — tarefas de teste omitidas; validação via `quickstart.md` na fase final.

**Organization**: Tarefas agrupadas por user story para implementação e validação independentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: User story (US1–US7)
- Caminhos conforme `plan.md` (`backend/`, `frontend/`, Docker na raiz)

## Path Conventions

- Backend: `backend/src/`
- Frontend: `frontend/public/`
- Docker: `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Estrutura do repositório e base Docker/Node

- [x] T001 Create project directories `backend/src/{db,routes,services,middleware}`, `backend/tests/{contract,integration}`, and `frontend/public/{totem,painel,shared}` per plan.md
- [x] T002 Create `backend/package.json` with Express, pg, and start scripts for Node.js 20
- [x] T003 [P] Create `backend/Dockerfile` for Node.js 20 API image
- [x] T004 [P] Create `frontend/Dockerfile` and `frontend/nginx.conf` to serve static files and proxy `/api` to the api service
- [x] T005 [P] Create root `docker-compose.yml` with services `db` (Postgres 16), `api`, and `web`
- [x] T006 [P] Create `.env.example` and `.dockerignore` at repository root
- [x] T007 [P] Create entry `frontend/public/index.html` linking to totem and painel

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infra compartilhada que bloqueia todas as user stories

**⚠️ CRITICAL**: Nenhuma user story começa antes desta fase

- [x] T008 Create Postgres pool and migrate runner in `backend/src/db/pool.js` and `backend/src/db/migrate.js`
- [x] T009 Create SQL migration for `tipos_exame`, `dias_operacionais`, `atendimentos`, and `eventos_log` per `data-model.md` in `backend/src/db/migrations/001_init.sql`
- [x] T010 Seed tipos de exame (`triagem`, `coleta_sangue`, `exame_campanha`) and open first `dia_operacional` in `backend/src/db/migrations/002_seed.sql`
- [x] T011 [P] Implement Express app bootstrap and error middleware in `backend/src/index.js` and `backend/src/middleware/errors.js`
- [x] T012 [P] Implement shared frontend API client in `frontend/public/shared/api.js` and base styles in `frontend/public/shared/styles.css`
- [x] T013 Implement `GET /api/exames` and `GET /api/dia` in `backend/src/routes/exames.js` and `backend/src/routes/dia.js` wired from `backend/src/index.js`
- [x] T014 Implement append-only `logService` in `backend/src/services/logService.js` (used by later stories)
- [x] T015 Verify `docker compose up --build` starts db + api + web and migrations apply (smoke check)

**Checkpoint**: Foundation ready — user stories podem começar

---

## Phase 3: User Story 1 - Emitir senha e entrar na fila (Priority: P1) 🎯 MVP

**Goal**: Totem público emite senha por tipo de exame com nome + documento; numeração sequencial do dia/tipo

**Independent Test**: Emitir senhas para um ou mais tipos e confirmar fila correta e sequência do dia (quickstart cenário 1 e 6)

### Implementation for User Story 1

- [x] T016 [US1] Implement `atendimentoService.emitirSenha` (validate nome/documento, allocate next numero in transaction) in `backend/src/services/atendimentoService.js`
- [x] T017 [US1] Implement `POST /api/atendimentos` in `backend/src/routes/atendimentos.js` per `contracts/openapi.yaml`
- [x] T018 [US1] Log `EMITIR_SENHA` via `logService` from emit flow in `backend/src/services/atendimentoService.js`
- [x] T019 [US1] Build totem UI emit flow in `frontend/public/totem/index.html`, `frontend/public/totem/totem.css`, and `frontend/public/totem/totem.js` (list exames, form, show senha; no prioritize/call actions)

**Checkpoint**: US1 functional — MVP demonstrável (emitir senha no totem)

---

## Phase 4: User Story 2 - Priorizar atendimento (Priority: P1)

**Goal**: Painel altera prioridade entre `rotina` e `urgente`; urgentes à frente na ordenação

**Independent Test**: Criar rotinas + um urgente; confirmar urgente aparece/é chamado antes (quickstart cenário 2 parcial)

### Implementation for User Story 2

- [x] T020 [US2] Implement `atendimentoService.alterarPrioridade` (only while `aguardando`) in `backend/src/services/atendimentoService.js`
- [x] T021 [US2] Implement `PATCH /api/atendimentos/{id}/prioridade` in `backend/src/routes/atendimentos.js`
- [x] T022 [US2] Log `PRIORIZAR` in `backend/src/services/atendimentoService.js`
- [x] T023 [US2] Add painel shell and priority controls in `frontend/public/painel/index.html`, `frontend/public/painel/painel.css`, and `frontend/public/painel/painel.js`

**Checkpoint**: US1 + US2 — emissão e priorização disponíveis

---

## Phase 5: User Story 3 - Chamar próximo e atualizar status (Priority: P2)

**Goal**: Painel vê filas, chama próximo (urgente FIFO depois rotina FIFO) com claim atômico, atualiza status

**Independent Test**: Emitir, priorizar, chamar e avançar status; ordem e status corretos (quickstart cenário 2)

### Implementation for User Story 3

- [x] T024 [US3] Implement `filaService.listarFilas` and `filaService.chamarProximo` with atomic claim (`FOR UPDATE SKIP LOCKED` or equivalent) in `backend/src/services/filaService.js`
- [x] T025 [US3] Implement `GET /api/filas` and `POST /api/filas/{tipoExameCodigo}/proximo` in `backend/src/routes/filas.js`
- [x] T026 [US3] Implement `atendimentoService.atualizarStatus` with allowed transitions and optional `resultado` in `backend/src/services/atendimentoService.js`
- [x] T027 [US3] Implement `PATCH /api/atendimentos/{id}/status` in `backend/src/routes/atendimentos.js`
- [x] T028 [US3] Log `CHAMAR_PROXIMO` and `ATUALIZAR_STATUS` in respective services
- [x] T029 [US3] Extend painel UI for queue view, call next, and status updates in `frontend/public/painel/painel.js` and `frontend/public/painel/index.html`

**Checkpoint**: Ciclo operacional completo da fila no dia aberto

---

## Phase 6: User Story 4 - Encerrar/abrir dia (Priority: P2)

**Goal**: Comando manual reinicia numeração; espera do dia anterior fica fora da fila ativa

**Independent Test**: Deixar alguém aguardando, encerrar/abrir dia, emitir nova senha — numeração recomeça; espera antiga fora da fila ativa (quickstart cenário 4)

### Implementation for User Story 4

- [x] T030 [US4] Implement `diaService.encerrarAbrir` (close current, open new; no calendar auto-reset) in `backend/src/services/diaService.js`
- [x] T031 [US4] Implement `POST /api/dia/encerrar-abrir` in `backend/src/routes/dia.js`
- [x] T032 [US4] Log `ENCERRAR_ABRIR_DIA` in `backend/src/services/diaService.js`
- [x] T033 [US4] Ensure fila queries only use dia `aberto` in `backend/src/services/filaService.js`
- [x] T034 [US4] Add “Encerrar/abrir dia” action and confirm UX in `frontend/public/painel/painel.js` and `frontend/public/painel/index.html`

**Checkpoint**: Virada de dia manual validada

---

## Phase 7: User Story 5 - Rastreabilidade do atendimento (Priority: P2)

**Goal**: Consulta estável por senha/tipo/dia mantém vínculo nome+documento+status

**Independent Test**: Emitir, mudar status, consultar novamente — vínculo íntegro (spec US5)

### Implementation for User Story 5

- [x] T035 [US5] Implement lookup by tipo + numero_senha (+ optional documento) returning full identification in `backend/src/services/atendimentoService.js`
- [x] T036 [US5] Expose staff-friendly detail in painel list/detail using existing atendimento payloads in `frontend/public/painel/painel.js`
- [x] T037 [US5] Add clear 404/error messages for invalid senha or wrong day in `backend/src/middleware/errors.js` and `frontend/public/shared/api.js`

**Checkpoint**: Rastreabilidade consultável no painel e erros claros

---

## Phase 8: User Story 6 - Consultar resultado no totem (Priority: P3)

**Goal**: Doador/paciente consulta status/resultado no totem

**Independent Test**: Concluir com resultado; consultar no totem; sem resultado mostra “indisponível” (quickstart cenário 3)

### Implementation for User Story 6

- [x] T038 [US6] Implement `GET /api/atendimentos/consulta` in `backend/src/routes/atendimentos.js` with `resultado_disponivel` flag
- [x] T039 [US6] Add consultation UI on totem in `frontend/public/totem/totem.js` and `frontend/public/totem/index.html`

**Checkpoint**: Comunicação de resultado via totem

---

## Phase 9: User Story 7 - Monitorar logs (Priority: P3)

**Goal**: Painel lista eventos de auditoria da simulação

**Independent Test**: Após roteiro de demo, logs mostram emissão, priorização, chamada, status e encerrar/abrir dia (quickstart cenário 5)

### Implementation for User Story 7

- [x] T040 [US7] Implement `GET /api/logs` in `backend/src/routes/logs.js` (limit/filter by `acao`)
- [x] T041 [US7] Add logs view section in `frontend/public/painel/index.html` and `frontend/public/painel/painel.js`

**Checkpoint**: Observabilidade da simulação no painel

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Fechamento operacional e validação E2E

- [x] T042 [P] Add README section for Docker quickstart linking `specs/001-fila-emergencia-sangue/quickstart.md` in `README.md`
- [x] T043 Handle empty queue, inactive exam type, and final-state mutation errors consistently in `backend/src/middleware/errors.js` and services
- [x] T044 Run full validation checklist from `specs/001-fila-emergencia-sangue/quickstart.md` with `docker compose up`
- [x] T045 [P] Align OpenAPI examples with final routes if any drift in `specs/001-fila-emergencia-sangue/contracts/openapi.yaml`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: sem dependências
- **Phase 2 (Foundational)**: depende da Phase 1 — **bloqueia** todas as stories
- **Phases 3–9 (US1–US7)**: dependem da Phase 2; preferir ordem P1 → P2 → P3
- **Phase 10 (Polish)**: após stories desejadas

### User Story Dependencies

- **US1 (P1)**: após Foundational — MVP
- **US2 (P1)**: após Foundational; UI painel inicia aqui (pode seguir US1)
- **US3 (P2)**: ideal após US2 (reusa painel); independente na API
- **US4 (P2)**: após US1 (emissão) e preferencialmente US3 (filas usam dia aberto)
- **US5 (P2)**: após US1; reforça consulta/detalhe
- **US6 (P3)**: após US3 (status/resultado) + US5 (lookup)
- **US7 (P3)**: após Foundational (logService); melhor após US1–US4 terem gerado eventos

### Parallel Opportunities

- T003–T007 em paralelo na Setup
- T011–T012 em paralelo na Foundational
- Após Foundational: US1 (API+totem) e esqueleto US2 (painel) podem avançar em paralelo se arquivos não colidirem
- T042 e T045 em paralelo no Polish

---

## Parallel Example: User Story 1

```bash
# Após T016–T018 (API pronta), UI pode seguir em paralelo a docs:
Task: "Build totem UI emit flow in frontend/public/totem/*"
```

## Parallel Example: Setup

```bash
Task: "Create backend/Dockerfile"
Task: "Create frontend/Dockerfile and nginx.conf"
Task: "Create docker-compose.yml"
Task: "Create .env.example and .dockerignore"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 → Setup
2. Phase 2 → Foundational
3. Phase 3 → US1 (emitir senha no totem)
4. **STOP**: validar quickstart cenário 1 e 6
5. Demo MVP

### Incremental Delivery

1. Setup + Foundational
2. US1 → MVP totem
3. US2 + US3 → painel operacional
4. US4 → virada de dia
5. US5 + US6 → rastreabilidade e resultado
6. US7 + Polish → logs e validação completa

### Suggested commit cadence

- Commit após Phase 1–2 (infra Docker)
- Commit após cada user story completa (US1…US7)
- Commit final após Phase 10

---

## Notes

- Sem autenticação (totem vs painel só por URL)
- Claim atômico em “chamar próximo” é obrigatório (concorrência)
- Reinício de dia **somente** via `POST /api/dia/encerrar-abrir`
- Prioridade exatamente `rotina` | `urgente`
