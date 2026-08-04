CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS tipos_exame (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS dias_operacionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aberto_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fechado_em TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('aberto', 'fechado'))
);

CREATE UNIQUE INDEX IF NOT EXISTS dias_operacionais_um_aberto
  ON dias_operacionais (status) WHERE (status = 'aberto');

CREATE TABLE IF NOT EXISTS atendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dia_operacional_id UUID NOT NULL REFERENCES dias_operacionais(id),
  tipo_exame_id UUID NOT NULL REFERENCES tipos_exame(id),
  numero_senha INTEGER NOT NULL CHECK (numero_senha >= 1),
  nome_completo TEXT NOT NULL,
  documento TEXT NOT NULL,
  prioridade TEXT NOT NULL DEFAULT 'rotina' CHECK (prioridade IN ('rotina', 'urgente')),
  status TEXT NOT NULL DEFAULT 'aguardando'
    CHECK (status IN ('aguardando', 'chamado', 'em_atendimento', 'concluido', 'cancelado')),
  resultado TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  chamado_em TIMESTAMPTZ,
  concluido_em TIMESTAMPTZ,
  UNIQUE (dia_operacional_id, tipo_exame_id, numero_senha)
);

CREATE INDEX IF NOT EXISTS idx_atendimentos_fila
  ON atendimentos (dia_operacional_id, tipo_exame_id, status, prioridade, created_at);

CREATE TABLE IF NOT EXISTS eventos_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ocorrido_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acao TEXT NOT NULL,
  atendimento_id UUID REFERENCES atendimentos(id),
  detalhe TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_eventos_log_ocorrido
  ON eventos_log (ocorrido_em DESC);
