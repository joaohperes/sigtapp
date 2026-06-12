-- RPC cids_relacionados_bloco — sugere CIDs do mesmo bloco para refinar o
-- diagnóstico, mas SÓ os que abrem procedimento de internação (03/04) que o CID
-- atual não tem. Versão inicial retornava todos os irmãos do bloco, mas para
-- pneumonia (J1) o procedimento clínico é um guarda-chuva único (0303140151)
-- compartilhado por todos — então refinar não mudava nada e vários chips levavam
-- a "nenhum procedimento". Agora só sugere quando refinar de fato agrega.
-- Aplicada via MCP. Idempotente.

CREATE OR REPLACE FUNCTION public.cids_relacionados_bloco(p_co_cid text)
 RETURNS TABLE(co_cid text, no_cid text)
 LANGUAGE sql
 STABLE
AS $function$
  WITH params AS (SELECT TRIM(UPPER(p_co_cid)) AS cid),
  procs_input AS (
    SELECT DISTINCT p.co_procedimento
    FROM procedimento_cids pc
    JOIN procedimentos p ON p.co_procedimento = pc.co_procedimento, params
    WHERE LEFT(p.co_procedimento,2) IN ('03','04')
      AND (TRIM(UPPER(pc.co_cid)) = LEFT(params.cid,3) OR TRIM(UPPER(pc.co_cid)) = params.cid)
  ),
  cids_que_agregam AS (
    SELECT DISTINCT LEFT(TRIM(pc.co_cid),3) AS cid3
    FROM procedimento_cids pc
    JOIN procedimentos p ON p.co_procedimento = pc.co_procedimento, params
    WHERE LEFT(TRIM(pc.co_cid),2) = LEFT(params.cid,2)
      AND LEFT(p.co_procedimento,2) IN ('03','04')
      AND p.co_procedimento NOT IN (SELECT co_procedimento FROM procs_input)
  )
  SELECT c.co_cid::text, c.no_cid::text
  FROM cid c, params
  WHERE c.co_cid ~ '^[A-Z][0-9][0-9]$'
    AND c.co_cid != LEFT(params.cid,3)
    AND c.co_cid IN (SELECT cid3 FROM cids_que_agregam)
  ORDER BY c.co_cid;
$function$;
