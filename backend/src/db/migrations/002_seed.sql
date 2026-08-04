INSERT INTO tipos_exame (codigo, nome, ativo)
VALUES
  ('triagem', 'Triagem', TRUE),
  ('coleta_sangue', 'Coleta de sangue', TRUE),
  ('exame_campanha', 'Exame da campanha', TRUE)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO dias_operacionais (status, aberto_em)
SELECT 'aberto', NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM dias_operacionais WHERE status = 'aberto'
);
