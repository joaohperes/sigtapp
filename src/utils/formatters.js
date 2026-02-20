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
