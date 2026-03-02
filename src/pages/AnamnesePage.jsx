import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ProcedureCard } from '../components/ProcedureCard'

const EXEMPLO = `Paciente masculino, 58 anos, hipertenso e diabético tipo 2. Queixa de dor torácica opressiva com irradiação para o membro superior esquerdo iniciada há 2 horas, associada a sudorese fria, náuseas e dispneia. Pressão arterial 160/100 mmHg, FC 98 bpm. ECG com supradesnivelamento de ST em V1-V4.`

export function AnamnesePage() {
  const navigate = useNavigate()
  const [anamnese, setAnamnese] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [cids, setCids] = useState([])
  const [procedimentos, setProcedimentos] = useState([])
  const [analyzed, setAnalyzed] = useState(false)

  async function handleAnalyze() {
    if (anamnese.trim().length < 20) return
    setLoading(true)
    setError(null)
    setCids([])
    setProcedimentos([])
    setAnalyzed(false)

    try {
      // 1. Chamar a Vercel function
      const res = await fetch('/api/analisar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anamnese }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao analisar')
      }

      const { cids: cidsSugeridos = [], termos = [] } = await res.json()

      // 2. Enriquecer CIDs com nomes do Supabase
      const cidCodes = cidsSugeridos.map(c => c.co_cid).filter(Boolean)
      let cidsEnriquecidos = cidsSugeridos

      if (cidCodes.length > 0) {
        const { data: cidRows } = await supabase
          .from('cid')
          .select('co_cid, no_cid')
          .in('co_cid', cidCodes)

        const cidMap = Object.fromEntries((cidRows || []).map(r => [r.co_cid, r.no_cid]))
        cidsEnriquecidos = cidsSugeridos.map(c => ({
          ...c,
          no_cid: cidMap[c.co_cid] ?? null,
        }))
      }

      // 3. Buscar procedimentos pelos termos sugeridos
      const buscas = await Promise.all(
        termos.slice(0, 5).map(t =>
          supabase.rpc('buscar_procedimentos', { query: t, limite: 10 })
        )
      )

      const seen = new Set()
      const procs = buscas
        .flatMap(r => r.data || [])
        .filter(p => {
          if (seen.has(p.co_procedimento)) return false
          seen.add(p.co_procedimento)
          return true
        })
        .slice(0, 12)

      setCids(cidsEnriquecidos)
      setProcedimentos(procs)
      setAnalyzed(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleVerProcedimentos(co_cid) {
    navigate(`/?q=${co_cid}`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <Link to="/" className="text-sm text-blue-300 hover:text-white transition">
            ← Voltar
          </Link>
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-white">Análise de Anamnese</h1>
            <p className="mt-1 text-sm text-blue-200">
              Cole o texto clínico e a IA identificará CIDs prováveis e procedimentos SIGTAP relacionados
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-6 py-8">
        {/* Input card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700">
              Texto clínico / Anamnese
            </label>
            {!anamnese && (
              <button
                onClick={() => setAnamnese(EXEMPLO)}
                className="text-xs text-blue-500 hover:underline"
              >
                Usar exemplo
              </button>
            )}
          </div>

          <textarea
            value={anamnese}
            onChange={e => setAnamnese(e.target.value)}
            placeholder="Descreva o quadro clínico do paciente: queixas, história, exame físico, hipóteses diagnósticas..."
            rows={7}
            className="w-full resize-y rounded-lg border border-slate-200 p-3 text-sm leading-relaxed
                       text-slate-700 placeholder:text-slate-400
                       focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
          />

          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-xs text-slate-400">
              Sugestões geradas por IA — confirme os códigos na tabela oficial antes de usar
            </p>
            <button
              onClick={handleAnalyze}
              disabled={loading || anamnese.trim().length < 20}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm
                         font-semibold text-white shadow-sm transition hover:bg-blue-700
                         disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Analisando...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Analisar com IA
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Resultados */}
        {analyzed && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">

            {/* Painel CIDs */}
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
                  {cids.length}
                </span>
                Diagnósticos CID-10 Prováveis
              </h2>

              {cids.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhum CID identificado</p>
              ) : (
                <div className="space-y-2">
                  {cids.map((c) => (
                    <div
                      key={c.co_cid}
                      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="font-mono text-sm font-bold text-indigo-600">
                            {c.co_cid}
                          </span>
                          {c.no_cid ? (
                            <p className="mt-0.5 text-sm font-medium text-slate-800 leading-snug">
                              {c.no_cid}
                            </p>
                          ) : (
                            <p className="mt-0.5 text-xs text-slate-400 italic">
                              Código não encontrado na tabela
                            </p>
                          )}
                          {c.justificativa && (
                            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                              {c.justificativa}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleVerProcedimentos(c.co_cid)}
                        className="mt-3 w-full rounded-lg border border-indigo-200 bg-indigo-50 py-1.5
                                   text-xs font-medium text-indigo-600 transition hover:bg-indigo-100"
                      >
                        Ver procedimentos →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Painel Procedimentos */}
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-600">
                  {procedimentos.length}
                </span>
                Procedimentos SIGTAP Sugeridos
              </h2>

              {procedimentos.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhum procedimento encontrado</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {procedimentos.map((p) => (
                    <ProcedureCard key={p.co_procedimento} procedure={p} />
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
