-- Cria a tabela procedimento_habilitacoes
-- Gerado em 2026-03-27T21:21:20.041Z

CREATE TABLE IF NOT EXISTS procedimento_habilitacoes (
  co_procedimento text NOT NULL,
  co_habilitacao  text NOT NULL,
  no_habilitacao  text NOT NULL,
  PRIMARY KEY (co_procedimento, co_habilitacao)
);

TRUNCATE TABLE procedimento_habilitacoes;

CREATE INDEX IF NOT EXISTS idx_proc_hab_co ON procedimento_habilitacoes (co_procedimento);
