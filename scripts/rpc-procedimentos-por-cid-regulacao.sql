-- RPC procedimentos_por_cid_regulacao — lista de procedimentos para regulação
-- de internação, dado um CID. Aplica blocklist de prefixos que NÃO são
-- regulação de internação aguda (reabilitação/seguimento ambulatorial).
--
-- 2026-06-11: removido '030410' do blocklist. Esse prefixo contém 2
-- procedimentos de SUPORTE clínico oncológico:
--   0304100013 TRATAMENTO DE INTERCORRÊNCIAS CLÍNICAS DE PACIENTE ONCOLÓGICO
--   0304100021 TRATAMENTO CLÍNICO DE PACIENTE ONCOLÓGICO
-- Estavam bloqueados por engano (colados junto com os de reabilitação 030319/
-- 030111, que permanecem). Era a causa de o código de intercorrência oncológica
-- não aparecer na Regulação — o caso real do osteossarcoma (C402).
--
-- 2026-06-12: esses 2 códigos são vinculados pela tabela SIGTAP a ~540 CIDs,
-- mas só ~507 são oncológicos; os ~33 restantes (pneumonia, ITU, sepse, anemia,
-- herpes zoster...) faziam "paciente oncológico" poluir a lista de CID não-onco.
-- Agora o prefixo 030410 só aparece em CID oncológico (cap. C ou D00-D48).
--
-- Aplicada no remoto via MCP. Re-rodar este arquivo é idempotente.

CREATE OR REPLACE FUNCTION public.procedimentos_por_cid_regulacao(p_co_cid text)
 RETURNS TABLE(co_procedimento text, no_procedimento text, grupo text, vl_sh numeric, vl_sa numeric, vl_sp numeric, st_principal character)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_cid TEXT := TRIM(UPPER(p_co_cid));
  v_tem_especificos_psiq BOOLEAN := FALSE;
  v_eh_oncologico BOOLEAN;
BEGIN
  -- Oncológico = cap. C, ou D00-D48 (neoplasias in situ/benignas/comportamento incerto)
  v_eh_oncologico := (LEFT(v_cid,1) = 'C')
    OR (LEFT(v_cid,1) = 'D' AND v_cid ~ '^D[0-9][0-9]'
        AND CAST(SUBSTRING(v_cid,2,2) AS int) BETWEEN 0 AND 48);

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
      -- 030109: atencao ambulatorial ao idoso (geriatria, avaliacao da pessoa
      -- idosa) — nao e regulacao de internacao. Poluia AVC/HAS/etc.
      '030109',
      -- Reabilitacao/seguimento ambulatorial: nao sao regulacao de internacao aguda.
      '030319','030111'
    )
    AND LEFT(p.co_procedimento, 6) != '030108'
    AND p.co_procedimento NOT IN (
      '0303070137'  -- intercorrencia pos-cirurgia bariatrica
    )
    -- Suporte oncológico (030410): só em CID oncológico, senão polui pneumonia/ITU/etc.
    AND NOT (
      LEFT(p.co_procedimento, 6) = '030410'
      AND NOT v_eh_oncologico
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
