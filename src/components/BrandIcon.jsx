// Ícone do app (mesmo do favicon): tile escuro arredondado + "S" esmeralda
// com a linha de ECG. Auto-contido — não recolore por tema; o tile já separa
// o ícone do fundo. Usado inline na navbar ao lado do wordmark.
export function BrandIcon({ className }) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="bi-tile" x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#202023" />
          <stop offset="1" stopColor="#101012" />
        </linearGradient>
        <linearGradient id="bi-mark" x1="16" y1="6" x2="16" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>

      <rect width="32" height="32" rx="7" fill="url(#bi-tile)" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="6.5" fill="none" stroke="#ffffff" strokeOpacity="0.07" />

      <path
        d="M6 27 H11.6 L13 24.4 L14.6 29.4 L16.1 27 H26"
        fill="none"
        stroke="url(#bi-mark)"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.5"
      />

      <path
        d="M21 10
           C 21 7.5, 18.6 6.3, 16 6.3
           C 13 6.3, 10.8 7.9, 10.8 10.5
           C 10.8 13.1, 13.4 14.1, 16 14.9
           C 18.6 15.7, 21.2 16.7, 21.2 19.6
           C 21.2 22.3, 18.8 23.7, 16 23.7
           C 13.2 23.7, 10.8 22.4, 10.8 19.8"
        fill="none"
        stroke="url(#bi-mark)"
        strokeWidth="2.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
