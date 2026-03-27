-- Cria a tabela procedimento_compatibilidades
-- Gerado em 2026-03-27T21:43:20.138Z

CREATE TABLE IF NOT EXISTS procedimento_compatibilidades (
  co_procedimento            text    NOT NULL,
  co_procedimento_compativel text    NOT NULL,
  no_procedimento_compativel text    NOT NULL,
  qt_permitida               integer,
  PRIMARY KEY (co_procedimento, co_procedimento_compativel)
);

TRUNCATE TABLE procedimento_compatibilidades;

CREATE INDEX IF NOT EXISTS idx_proc_compat_co ON procedimento_compatibilidades (co_procedimento);
