export function exportCsv(results, filename = 'procedimentos.csv') {
  const headers = ['Código', 'Procedimento', 'SA (R$)', 'SH (R$)', 'SP (R$)', 'Total (R$)']
  const rows = results.map((p) => {
    const total = (p.vl_sa || 0) + (p.vl_sh || 0) + (p.vl_sp || 0)
    return [
      formatCodigo(p.co_procedimento),
      p.no_procedimento,
      (p.vl_sa || 0).toFixed(2),
      (p.vl_sh || 0).toFixed(2),
      (p.vl_sp || 0).toFixed(2),
      total.toFixed(2),
    ]
  })
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function formatBRL(value) {
  return Number(value ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function formatCodigo(codigo) {
  // 0301010064 → 03.01.01.006-4
  if (!codigo || codigo.length !== 10) return codigo
  return `${codigo.slice(0, 2)}.${codigo.slice(2, 4)}.${codigo.slice(4, 6)}.${codigo.slice(6, 9)}-${codigo.slice(9)}`
}

export function toSentenceCase(str) {
  if (!str) return str
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}
