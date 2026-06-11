-- RPC procedimentos_por_cid_regulacao — lista de procedimentos para regulação
-- de internação, dado um CID. Aplica blocklist de prefixos que NÃO são
-- regulação de internação aguda (reabilitação/seguimento ambulatorial).
--
-- 2026-06-11: removido '030410' do blocklist. Esse prefixo continha apenas 2
-- procedimentos, ambos SUPORTE clínico oncológico de uso amplo (~540 CIDs):
--   0304100013 TRATAMENTO DE INTERCORRÊNCIAS CLÍNICAS DE PACIENTE ONCOLÓGICO
--   0304100021 TRATAMENTO CLÍNICO DE PACIENTE ONCOLÓGICO
-- Estavam bloqueados por engano (colados junto com os de reabilitação 030319/
-- 030111, que permanecem). Era a causa de o código de intercorrência oncológica
-- não aparecer na Regulação — o caso real do osteossarcoma (C402). Validado:
-- remover só 030410 traz de volta exatamente esses 2 códigos e nada mais.
--
-- Aplicada no remoto via MCP (migration regulacao_libera_030410_suporte_oncologico).
-- Re-rodar este arquivo é idempotente.

CREATE OR REPLACE FUNCTION public.procedimentos_por_cid_regulacao(p_co_cid text)
 RETURNS TABLE(co_procedimento text, no_procedimento text, grupo text, vl_sh numeric, vl_sa numeric, vl_sp numeric, st_principal character)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_cid TEXT := TRIM(UPPER(p_co_cid));
  v_tem_especificos_psiq BOOLEAN := FALSE;
BEGIN
  IF LEFT(v_cid, 1) = 'F' THEN
    SELECT EXISTS (
      SELECT 1 FROM procedimento_cids pc
      JOIN procedimentos p ON p.co_procedimento = pc.co_procedimento
      WHERE TRIM(UPPER(pc.co_cid)) = v_cid
        AND p.co_procedimento IN ('0303170131','0303170140','0303170158','0303170166')
    ) INTO v_tem_especificos_psiq;
  END IF;

  RETURN QUERY
  SELECT DISTINCT ON (p.co_procedimento)
    p.co_procedimento,
    p.no_procedimento,
    LEFT(p.co_procedimento, 2) as grupo,
    p.vl_sh::NUMERIC,
    p.vl_sa::NUMERIC,
    p.vl_sp::NUMERIC,
    pc.st_principal
  FROM procedimento_cids pc
  JOIN procedimentos p ON p.co_procedimento = pc.co_procedimento
  WHERE TRIM(UPPER(pc.co_cid)) = v_cid
    AND LEFT(p.co_procedimento, 2) IN ('03', '04')
    -- Fisioterapia (0302) inteira: reabilitacao ambulatorial.
    AND LEFT(p.co_procedimento, 4) != '0302'
    AND LEFT(p.co_procedimento, 6) NOT IN (
      '030107','030105','030101','030113',
      -- Reabilitacao/seguimento ambulatorial: nao sao regulacao de internacao aguda.
      -- 030319 "Tratamento em reabilitacao" vazava p/ encefalopatia/neuro (G934 etc).
      -- 030111 "Acompanhamento de queimado" e seguimento e gera glosa em internacao.
      '030319','030111'
      -- NOTA: '030410' foi REMOVIDO deste blocklist. Continha apenas suporte
      -- clinico oncologico (0304100013 / 0304100021), bloqueado por engano.
    )
    AND LEFT(p.co_procedimento, 6) != '030108'
    AND p.co_procedimento NOT IN (
      '0303070137'  -- intercorrencia pos-cirurgia bariatrica
    )
    AND NOT (
      v_tem_especificos_psiq = TRUE
      AND p.co_procedimento IN (
        '0303170093','0303170107','0303170190','0303170204'
      )
    )
    AND NOT (
      LEFT(v_cid, 3) = 'A41'
      AND p.co_procedimento = '0305010174'
    )
  ORDER BY p.co_procedimento, pc.st_principal DESC;
END;
$function$;
