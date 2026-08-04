# Data Model: Fila de Emergência para Coleta e Exame de Sangue

**Feature**: `001-fila-emergencia-sangue`  
**Date**: 2026-08-04

## Entities

### TipoExame

Categoria de atendimento com fila própria.

| Field | Type | Rules |
|-------|------|--------|
| id | UUID / serial | PK |
| codigo | string | único, estável (ex.: `triagem`) |
| nome | string | rótulo UI |
| ativo | boolean | default true; inativo não aparece no totem |

**Seed**: `triagem`, `coleta_sangue`, `exame_campanha`.

### DiaOperacional

Janela que delimita a numeração das senhas.

| Field | Type | Rules |
|-------|------|--------|
| id | UUID / serial | PK |
| aberto_em | timestamptz | obrigatório |
| fechado_em | timestamptz | null enquanto aberto |
| status | enum | `aberto` \| `fechado` |

**Invariants**:
- No máximo **um** dia com `status = aberto` por vez.
- Encerrar/abrir: fecha o aberto (set `fechado_em`) e cria novo `aberto`.

### Atendimento

Senha/registro de uma pessoa na fila de um tipo em um dia.

| Field | Type | Rules |
|-------|------|--------|
| id | UUID / serial | PK |
| dia_operacional_id | FK | obrigatório |
| tipo_exame_id | FK | obrigatório |
| numero_senha | int | ≥ 1; único com (dia, tipo) |
| nome_completo | string | obrigatório, trim, não vazio |
| documento | string | obrigatório, trim, não vazio (CPF ou RG) |
| prioridade | enum | `rotina` (default) \| `urgente` |
| status | enum | ver ciclo abaixo |
| resultado | enum/string nullable | `apto` \| `inapto` \| texto curto; null = indisponível |
| created_at | timestamptz | ordem FIFO |
| updated_at | timestamptz | |
| chamado_em | timestamptz nullable | |
| concluido_em | timestamptz nullable | |

**Uniqueness**: `(dia_operacional_id, tipo_exame_id, numero_senha)`.

**Fila ativa**: atendimentos do dia **aberto** com `status = aguardando` (e opcionalmente visualização de `chamado` / `em_atendimento` no painel).

**Virada de dia**: registros do dia fechado **não** entram na fila ativa do novo dia, mesmo se ainda `aguardando`; equipe conclui/cancela no histórico do dia anterior.

### EventoLog

Registro imutável de operação relevante.

| Field | Type | Rules |
|-------|------|--------|
| id | UUID / serial | PK |
| ocorrido_em | timestamptz | default now |
| acao | string | ex.: `EMITIR_SENHA`, `PRIORIZAR`, `CHAMAR_PROXIMO`, `ATUALIZAR_STATUS`, `ENCERRAR_ABRIR_DIA` |
| atendimento_id | FK nullable | quando aplicável |
| detalhe | text/json | resumo legível (senha, tipo, de→para) |

Append-only; sem update/delete na simulação.

## Relationships

```text
TipoExame 1──* Atendimento
DiaOperacional 1──* Atendimento
Atendimento 0..1──* EventoLog
```

## State transitions (Atendimento.status)

Estados mínimos: `aguardando` → `chamado` → `em_atendimento` → `concluido`  
Também: `cancelado` (encerramento manual pós-virada ou desistência); aptidão via `resultado` ao concluir (`apto` / `inapto`).

```text
aguardando ──CHAMAR──► chamado ──INICIAR──► em_atendimento ──CONCLUIR──► concluido
     │                      │                      │
     └──── CANCELAR ────────┴────── CANCELAR ──────┘
                              (estados finais: concluido, cancelado)
```

**Regras**:
- Só `aguardando` compete em “próximo”.
- Prioridade só alterável em `aguardando` (e talvez `chamado`); bloqueada em estados finais.
- Transições inválidas → erro claro (FR-013).

## Queue ordering

Para um `tipo_exame_id` no dia aberto:

1. `status = aguardando` AND `prioridade = urgente` ORDER BY `created_at` ASC  
2. senão `status = aguardando` AND `prioridade = rotina` ORDER BY `created_at` ASC  

Claim atômico na chamada para evitar double-call.

## Validation rules (from spec)

- Emissão sem nome ou documento → rejeitar (FR-016).
- Tipo inexistente/inativo → rejeitar.
- Número de senha: próximo inteiro do tipo no dia aberto.
- Consulta por senha inválida / outro dia → mensagem clara, sem vazar dados indevidos.
- Fila vazia ao chamar próximo → mensagem clara, sem erro fatal.
