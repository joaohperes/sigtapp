-- RPC procedimentos_por_cid_regulacao — lista de procedimentos para regulação
-- de internação, dado um CID.
--
-- Blocklist de prefixos ambulatoriais/seguimento (não são internação aguda):
--   030104 atenção primária, 030112 acompanhamento de crônicas, 030109 geriatria,
--   030319/030111 reabilitação, 0302 fisio inteira, etc. + códigos pontuais em
--   prefixos mistos (glaucoma fundoscopia, diálise domiciliar/treinamento...).
-- Suporte oncológico (030410) só em CID oncológico (cap. C / D00-D48).
--
-- Granularidade (2026-06-12): quando o CID buscado é CATEGORIA de 3 chars, casa
-- o PREFIXO (próprio + subcategorias), não só o exato. Sem isso, ~1078 categorias
-- davam "nenhum procedimento" (os vínculos estão nas subcategorias: I63→I630-I639
-- com trombólise/trombectomia; N30→N300-N309 com proc urológicos). Subcategorias
-- são variações da mesma doença → agregado coerente. CID de 4 chars: match exato.
--
-- Aplicada no remoto via MCP. Idempotente.

CREATE OR REPLACE FUNCTION public.procedimentos_por_cid_regulacao(p_co_cid text)
 RETURNS TABLE(co_procedimento text, no_procedimento text, grupo text, vl_sh numeric, vl_sa numeric, vl_sp numeric, st_principal character)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_cid TEXT := TRIM(UPPER(p_co_cid));
  v_tem_especificos_psiq BOOLEAN := FALSE;
  v_eh_oncologico BOOLEAN;
  v_expandir BOOLEAN;
BEGIN
  v_eh_oncologico := (LEFT(v_cid,1) = 'C')
    OR (LEFT(v_cid,1) = 'D' AND v_cid ~ '^D[0-9][0-9]'
        AND CAST(SUBSTRING(v_cid,2,2) AS int) BETWEEN 0 AND 48);

  -- Categoria de 3 chars: casa próprio + subcategorias (prefixo).
  v_expandir := (v_cid ~ '^[A-Z][0-9][0-9]$');

  IF LEFT(v_cid, 1) = 'F' THEN
    SELECT EXISTS (
      SELECT 1 FROM procedimento_cids pc
      JOIN procedimentos p ON p.co_procedimento = pc.co_procedimento
      WHERE (CASE WHEN v_expandir THEN TRIM(UPPER(pc.co_cid)) LIKE v_cid || '%'
                  ELSE TRIM(UPPER(pc.co_cid)) = v_cid END)
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
  WHERE (CASE WHEN v_expandir THEN TRIM(UPPER(pc.co_cid)) LIKE v_cid || '%'
              ELSE TRIM(UPPER(pc.co_cid)) = v_cid END)
    AND LEFT(p.co_procedimento, 2) IN ('03', '04')
    AND LEFT(p.co_procedimento, 4) != '0302'
    AND LEFT(p.co_procedimento, 6) NOT IN (
      '030107','030105','030101','030113',
      '030104','030112','030109',
      '030319','030111'
    )
    AND LEFT(p.co_procedimento, 6) != '030108'
    AND p.co_procedimento NOT IN (
      '0303070137','0301160015','0303050012','0303050020',
      '0305010166','0305010182','0305010212'
    )
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
