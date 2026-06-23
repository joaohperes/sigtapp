// Marca reduzida do SIGTAPP — o "S" do favicon, sem o tile, para uso inline.
// Usa currentColor: a cor é controlada por quem renderiza (verde no claro/escuro,
// branco no Modo Emergência). Versão sem a linha de ECG do favicon, que vira
// ruído nesse tamanho — aqui o S sozinho lê mais limpo ao lado do wordmark.
export function BrandMark({ className }) {
  return (
    <svg
      viewBox="4 1.5 14 21"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M16 7.5 C16 5,13.7 3.5,11 3.5 C8 3.5,5.8 5.2,5.8 7.8
           C5.8 10.2,8.2 11,11 12 C13.8 13,16.2 13.8,16.2 16.5
           C16.2 19.2,13.8 20.8,11 20.8 C8.2 20.8,5.8 19.3,5.8 16.8"
        stroke="currentColor"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
