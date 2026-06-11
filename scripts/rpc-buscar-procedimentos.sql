-- RPC buscar_procedimentos — busca ADITIVA por nome de procedimento.
--
-- Histórico: a versão original fazia ILIKE '%frase inteira%', exigindo que os
-- termos aparecessem contíguos e na ordem digitada. Isso fazia buscas naturais
-- como "fratura pé" ou "fratura membro" retornarem ZERO resultados, mesmo
-- existindo dezenas de procedimentos de fratura.
--
-- Esta versão: cada palavra da query precisa aparecer em qualquer posição do
-- nome (AND entre termos). Termos de 2 chars (pé, mão) casam como PALAVRA
-- inteira (regex \m..\M) para não casar substrings espúrias (pé→pelve);
-- termos >=3 chars casam como substring; stopwords e termos de 1 char são
-- ignorados; se a query inteira só tiver stopwords, faz fallback p/ similarity.
--
-- Aplicada no projeto remoto via MCP (migration buscar_procedimentos_aditiva,
-- 2026-06-11). Mantida aqui versionada porque as RPCs do projeto não vivem em
-- uma esteira de migrations local. Re-rodar este arquivo é idempotente.

CREATE OR REPLACE FUNCTION public.buscar_procedimentos(query text, limite integer DEFAULT 50)
 RETURNS TABLE(co_procedimento text, no_procedimento text, vl_sa numeric, vl_sh numeric, vl_sp numeric, tp_financiamento text, no_financiamento text, qt_dias_perman integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
  WITH q AS (SELECT unaccent_immutable(lower(query)) AS norm),
  termos AS (
    SELECT array_agg(t) AS arr
    FROM q, unnest(string_to_array(norm, ' ')) t
    WHERE length(t) >= 2
      AND t NOT IN ('de','do','da','dos','das','e','o','a','em','por','com','sem','ao','na','no','que','para')
  )
  SELECT
    p.co_procedimento, p.no_procedimento,
    p.vl_sa, p.vl_sh, p.vl_sp,
    p.tp_financiamento, p.no_financiamento, p.qt_dias_perman
  FROM procedimentos p, termos, q
  WHERE
    (termos.arr IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM unnest(termos.arr) AS termo
      WHERE CASE
        WHEN length(termo) = 2 THEN unaccent_immutable(p.no_procedimento) !~* ('\m'||termo||'\M')
        ELSE unaccent_immutable(p.no_procedimento) NOT ILIKE '%'||termo||'%'
      END
    ))
    OR (termos.arr IS NULL AND similarity(unaccent_immutable(p.no_procedimento), q.norm) > 0.3)
  ORDER BY
    (unaccent_immutable(p.no_procedimento) ILIKE '%'||q.norm||'%') DESC,
    similarity(unaccent_immutable(p.no_procedimento), q.norm) DESC
  LIMIT limite;
$function$;
