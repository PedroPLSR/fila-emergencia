# Research: Fila de Emergência para Coleta e Exame de Sangue

**Date**: 2026-08-04  
**Feature**: `001-fila-emergencia-sangue`

## 1. Runtime local

**Decision**: Docker Compose com três serviços — `db` (PostgreSQL 16), `api` (Node/Express), `web` (nginx servindo HTML/CSS/JS).

**Rationale**: O usuário pediu explicitamente Docker na máquina (Docker Desktop já aberto). Compose padroniza banco + app sem instalar Node/Postgres no host e facilita demonstração com `docker compose up`.

**Alternatives considered**:
- Node/Postgres nativos no Windows — rejeitado (pedido de Docker).
- Só Postgres no Docker e app no host — rejeitado (runtime incompleto; divergência de ambiente).
- Tudo em um único container — rejeitado (pior isolamento e ciclo de rebuild do banco).

## 2. Backend

**Decision**: Node.js 20 + Express + `pg`.

**Rationale**: Alinha com frontend JS vanilla; Express é suficiente para REST da simulação; ecossistema simples para JSON e middleware de erro. Backend estava em aberto em `assets/solucao.md`.

**Alternatives considered**:
- Python FastAPI — viável, mas introduz segunda linguagem sem ganho claro neste escopo.
- Laravel/Filament — overkill para simulação de fila + totem.
- SQLite embutido — possível, mas Postgres no Compose atende melhor concorrência de “chamar próximo” e é padrão com Docker.

## 3. Frontend

**Decision**: HTML/CSS/JS vanilla em duas rotas/páginas (`/totem`, `/painel`), sem framework SPA.

**Rationale**: Spec e `solucao.md` pedem tela simples estilo totem hospitalar; vanilla reduz complexidade e entrega rápido.

**Alternatives considered**:
- React/Vue — rejeitado para v1 (desnecessário ao escopo).
- Servir estáticos pelo próprio Express — possível; nginx no serviço `web` separa melhor papéis e espelha deploy típico.

## 4. Banco e numeração de senha

**Decision**: PostgreSQL 16; tabela `atendimentos` com unicidade `(dia_operacional_id, tipo_exame_id, numero_senha)`; sequência por tipo/dia via `MAX(numero)+1` em transação ou tabela de contadores por dia/tipo.

**Rationale**: Garante FR-009 (sem reuso no mesmo dia/tipo) e reinício limpo ao abrir novo dia.

**Alternatives considered**:
- SEQUENCE do Postgres por tipo — mais complexo ao reiniciar dia.
- UUID como “senha” — foge do modelo mental de senha numérica de emergência.

## 5. Prioridade e chamada

**Decision**: Enum `rotina` | `urgente`; “próximo” = primeiro `aguardando` urgente por `created_at`, senão primeiro `aguardando` rotina; claim atômico com `UPDATE ... WHERE id = (...) AND status = 'aguardando' RETURNING *` (ou `FOR UPDATE SKIP LOCKED`) para concorrência entre operadores.

**Rationale**: Atende FR-004/005 e o edge case de duas estações chamando ao mesmo tempo (Deferred na clarify → resolvido aqui).

**Alternatives considered**:
- Triagem de 3 cores — rejeitado na clarify (dois níveis).
- Fila em memória Redis — overkill; Postgres basta na simulação.

## 6. Dia operacional

**Decision**: Tabela `dias_operacionais` com um registro `aberto`; comando `POST /dia/encerrar-abrir` fecha o atual e abre outro; sem job de meia-noite.

**Rationale**: Clarify Q5 — reinício só manual.

**Alternatives considered**: Cron à meia-noite — rejeitado na clarify.

## 7. Logs

**Decision**: Tabela `eventos_log` append-only (ação, entidade, payload resumido, timestamp); escrita no mesmo fluxo das mutações de negócio.

**Rationale**: FR-011 / User Story 7; consultável no painel.

**Alternatives considered**: Só stdout do container — insuficiente para consulta no painel; ELK — fora de escopo.

## 8. Identificação

**Decision**: Campos obrigatórios `nome_completo` e `documento` (string; CPF ou RG sem validação fiscal rígida na v1, apenas não-vazio + tamanho mínimo).

**Rationale**: Clarify Q4; simulação não exige integração Receita Federal.

**Alternatives considered**: Código anônimo — rejeitado; validação CPF checksum — opcional futura, não bloqueante.

## 9. Tipos de exame (seed)

**Decision**: Seed inicial: `triagem`, `coleta_sangue`, `exame_campanha` (rótulos amigáveis na UI).

**Rationale**: Assumption da spec (lista configurável na implementação).

**Alternatives considered**: CRUD completo de tipos na v1 — adiado; seed fixo cobre a demo.

## 10. Autenticação

**Decision**: Nenhuma. Separação só por URL/página (totem vs painel).

**Rationale**: Clarify Q1 / FR-015; autenticação corporativa fora de escopo.

**Alternatives considered**: PIN no painel — rejeitado na clarify (sem login formal).
