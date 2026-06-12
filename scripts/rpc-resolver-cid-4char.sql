-- Resolve códigos CID de 3 chars para a subcategoria de 4 chars (XXX9 ou a
-- subcategoria correta). Usado pelo /api/analisar: o modelo (llama) desobedece
-- a regra de formato e retorna J18 em vez de J189. "Completar com 9" falha em
-- ~19% das categorias, por isso resolve via banco. Aplicada via MCP. Idempotente.
CREATE OR REPLACE FUNCTION public.resolver_cid_4char(p_codigos text[])
 RETURNS TABLE(entrada text, resolvido text, no_cid text)
 LANGUAGE sql STABLE
AS $function$
  WITH resolvido AS (
    SELECT e.cod AS entrada,
      CASE
        WHEN length(e.cod) >= 4 THEN e.cod
        ELSE COALESCE(
          (SELECT c.co_cid FROM cid c WHERE c.co_cid = e.cod || '9'),
          (SELECT c.co_cid FROM cid c WHERE c.co_cid LIKE e.cod || '_' ORDER BY c.co_cid DESC LIMIT 1),
          e.cod
        )
      END AS resolvido
    FROM unnest(p_codigos) AS e(cod)
  )
  SELECT r.entrada, r.resolvido, (SELECT no_cid FROM cid WHERE co_cid = r.resolvido) AS no_cid
  FROM resolvido r;
$function$;
