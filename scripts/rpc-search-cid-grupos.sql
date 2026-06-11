-- RPC search_cid_grupos — busca aditiva de CID por grupos de sinônimos
-- (AND entre grupos, OR dentro de cada grupo).
--
-- 2026-06-11: termos de 2 chars (pé, mão) passaram a casar como PALAVRA inteira
-- (regex \m..\M) em vez de substring. Antes o front descartava termos de 2 chars
-- (filtro length>=3 em useCidSearch.js), fazendo "fratura pe" buscar só
-- "fratura" → 140 resultados. Agora o front passa o termo (length>=2) e a RPC o
-- casa como palavra → "fratura pe" retorna os 3 CIDs de fratura do pé. Espelha o
-- tratamento de buscar_procedimentos. Aplicada via MCP.

CREATE OR REPLACE FUNCTION public.search_cid_grupos(termos_grupos jsonb, prioritarios text[] DEFAULT '{}'::text[])
 RETURNS TABLE(co_cid text, no_cid text, tp_sexo text)
 LANGUAGE plpgsql
 STABLE
AS $function$
DECLARE
  v_primeiro text := unaccent(lower(coalesce(termos_grupos->0->>0, '')));
BEGIN
  RETURN QUERY
  SELECT c.co_cid::text, c.no_cid::text, c.tp_sexo::text
  FROM cid c
  WHERE (
    -- bool_and sobre os grupos: todo grupo precisa casar (AND entre grupos)
    SELECT bool_and(
      -- bool_or sobre as alternativas do grupo: basta uma casar (OR interno)
      (SELECT bool_or(
         CASE WHEN length(alt) <= 2
           THEN unaccent(lower(c.no_cid)) ~* ('\m' || unaccent(lower(alt)) || '\M')
           ELSE unaccent(lower(c.no_cid)) ILIKE '%' || unaccent(lower(alt)) || '%'
         END)
       FROM jsonb_array_elements_text(grupo) alt)
    )
    FROM jsonb_array_elements(termos_grupos) grupo
  )
  ORDER BY
    (trim(c.co_cid) = ANY(prioritarios)) DESC,
    (position(v_primeiro in unaccent(lower(c.no_cid))) = 1) DESC,
    (left(trim(c.co_cid),1) IN ('P','Z')) ASC,
    position(v_primeiro in unaccent(lower(c.no_cid))) ASC,
    length(c.no_cid) ASC,
    c.co_cid
  LIMIT 800;
END;
$function$;
