# Implementation Plan: Fila de Emergência para Coleta e Exame de Sangue

**Branch**: `001-fila-emergencia-sangue` | **Date**: 2026-08-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-fila-emergencia-sangue/spec.md`

**Note**: Runtime local obrigatório via Docker (Docker Desktop já disponível na máquina do desenvolvedor).

## Summary

Simulação de posto emergencial de coleta/exame de sangue (Castelão) com **totem público** (emitir senha + consultar status) e **painel da equipe** (priorizar, chamar, status, encerrar/abrir dia, logs). Filas por tipo de exame, prioridade binária (rotina/urgente), numeração reiniciada só por comando manual, persistência de atendimentos e logs de auditoria.

Abordagem técnica: frontend estático HTML/CSS/JS; API REST em Node.js (Express); PostgreSQL; tudo orquestrado com **Docker Compose** (serviços `web`/`api` + `db`) para subir e validar na máquina local com um único comando.

## Technical Context

**Language/Version**: JavaScript (ES2022+) no frontend; Node.js 20 LTS no backend

**Primary Dependencies**: Express, pg (node-postgres), Docker Compose; frontend vanilla (sem framework)

**Storage**: PostgreSQL 16 (container `db`)

**Testing**: testes de API com Node test runner / supertest; validação E2E manual via `quickstart.md` no Compose

**Target Platform**: Docker Desktop no Windows (containers Linux); browser local para totem e painel

**Project Type**: web application (frontend estático + backend API + banco)

**Performance Goals**: emissão de senha e consulta de próximo em latência perceptível < 2s em uso local; suporte a roteiros com ≥50 atendimentos na simulação

**Constraints**: sem login formal; sem integrações hospitalares externas; reinício de dia apenas manual; execução local via Docker (não depender de instalação nativa de Node/Postgres no host além do Docker)

**Scale/Scope**: 2 superfícies de UI (totem + painel), ~3–5 tipos de exame seed, 1 dia operacional ativo por vez, demonstração de evento/campanha (não produção multi-estádio)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constituição ratificada **v1.0.0** (`.specify/memory/constitution.md`). Gates por princípio:

| Gate | Status | Notes |
|------|--------|-------|
| I. Docker Compose First | PASS | Runtime local só via Compose (`db`/`api`/`web`); quickstart e README alinhados |
| II. Spec/Plan/Tasks Coevolution | PASS | Artefatos nesta pasta coevoluem; CI `.github/workflows/spec-validation.yml` falha PRs que alteram `spec.md` sem `plan.md` e `tasks.md` |
| III. No Corporate Auth in v1 | PASS | Totem e painel sem login (FR-015); SSO/VPN fora de escopo |
| IV. Stack Simplicity | PASS | Vanilla HTML/CSS/JS + nginx, Express, PostgreSQL; sem ORM/SPA/frameworks extras |
| V. Mandatory Queue Audit Logs | PASS | `EventoLog` com superfície do ator, ação, identidade da senha/fila e timestamp; mutações de fila e audit na mesma transação (falha conjunta) |

**Post-design re-check**: PASS — princípios I–V satisfeitos no desenho; Compose único runtime local; audit atômico com `superficie_ator`.

## Project Structure

### Documentation (this feature)

```text
specs/001-fila-emergencia-sangue/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
docker-compose.yml
.dockerignore
.env.example

backend/
├── Dockerfile
├── package.json
├── src/
│   ├── index.js
│   ├── db/
│   │   ├── pool.js
│   │   └── migrate.js
│   ├── routes/
│   │   ├── exames.js
│   │   ├── atendimentos.js
│   │   ├── filas.js
│   │   ├── dia.js
│   │   └── logs.js
│   ├── services/
│   │   ├── filaService.js
│   │   ├── atendimentoService.js
│   │   └── logService.js
│   └── middleware/
│       └── errors.js
└── tests/
    ├── contract/
    └── integration/

frontend/
├── Dockerfile              # nginx serve estáticos (ou stage no compose)
├── nginx.conf
├── public/
│   ├── index.html          # entrada / escolha totem vs painel
│   ├── totem/
│   │   ├── index.html
│   │   ├── totem.css
│   │   └── totem.js
│   ├── painel/
│   │   ├── index.html
│   │   ├── painel.css
│   │   └── painel.js
│   └── shared/
│       ├── api.js
│       └── styles.css
```

**Structure Decision**: Web app com `frontend/` (HTML/CSS/JS + nginx) e `backend/` (Express) separados, unidos por `docker-compose.yml` com serviços `db`, `api` e `web`. Espelha as duas superfícies da spec e o pedido explícito de Docker na máquina local.

## Complexity Tracking

> Sem violações de constituição a justificar (princípios I–V PASS; desenho permanece simples).
