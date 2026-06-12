-- RPCs do Mapa de diagnósticos (navegação Sistema → categoria → subcategoria).
-- Aplicadas via MCP. Idempotentes. Só CIDs com procedimento de internação
-- (03/04), excluindo Z, para o mapa não ter becos sem saída.

-- Filhos do próximo nível sob um prefixo (categoria->subcategorias etc).
CREATE OR REPLACE FUNCTION public.cids_mapa_filhos(p_prefixo text)
 RETURNS TABLE(co_cid text, no_cid text, tem_filhos boolean)
 LANGUAGE sql STABLE
AS $function$
  WITH params AS (SELECT TRIM(UPPER(p_prefixo)) AS pref),
  alvo_len AS (SELECT length(pref) + 1 AS n FROM params),
  com_proc AS (
    SELECT DISTINCT TRIM(UPPER(pc.co_cid)) AS cid
    FROM procedimento_cids pc JOIN procedimentos p ON p.co_procedimento = pc.co_procedimento
    WHERE LEFT(p.co_procedimento,2) IN ('03','04') AND TRIM(UPPER(pc.co_cid)) NOT LIKE 'Z%'
  )
  SELECT c.co_cid::text, c.no_cid::text,
    EXISTS (SELECT 1 FROM com_proc cp WHERE cp.cid LIKE c.co_cid || '_%') AS tem_filhos
  FROM cid c, params, alvo_len
  WHERE length(c.co_cid) = alvo_len.n
    AND LEFT(c.co_cid, length(params.pref)) = params.pref
    AND EXISTS (SELECT 1 FROM com_proc cp WHERE cp.cid LIKE c.co_cid || '%')
  ORDER BY c.co_cid;
$function$;

-- Categorias (3 chars) sob um conjunto de prefixos (um sistema clínico abrange
-- várias faixas, ex neuro = {G, I6}).
CREATE OR REPLACE FUNCTION public.cids_mapa_categorias(p_prefixos text[])
 RETURNS TABLE(co_cid text, no_cid text, tem_filhos boolean)
 LANGUAGE sql STABLE
AS $function$
  WITH com_proc AS (
    SELECT DISTINCT TRIM(UPPER(pc.co_cid)) AS cid
    FROM procedimento_cids pc JOIN procedimentos p ON p.co_procedimento = pc.co_procedimento
    WHERE LEFT(p.co_procedimento,2) IN ('03','04') AND TRIM(UPPER(pc.co_cid)) NOT LIKE 'Z%'
  )
  SELECT c.co_cid::text, c.no_cid::text,
    EXISTS (SELECT 1 FROM com_proc cp WHERE cp.cid LIKE c.co_cid || '_%') AS tem_filhos
  FROM cid c
  WHERE c.co_cid ~ '^[A-Z][0-9][0-9]$'
    AND EXISTS (SELECT 1 FROM unnest(p_prefixos) pref WHERE LEFT(c.co_cid, length(pref)) = UPPER(pref))
    AND EXISTS (SELECT 1 FROM com_proc cp WHERE cp.cid LIKE c.co_cid || '%')
  ORDER BY c.co_cid;
$function$;
