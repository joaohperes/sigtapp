import { Sheet, SheetContent } from '@/components/ui/sheet'

// ── Conteúdo dos guias por página ─────────────────────────────────────────────

const GUIDES = {
  home: {
    titulo: 'Como usar a Busca',
    secoes: [
      {
        titulo: 'Pesquisando procedimentos',
        itens: [
          'Digite o nome, código SIGTAP (ex: 03.03.14.015) ou CID-10 (ex: J18)',
          'Use o seletor "Tudo / CID-10 / Código" abaixo da barra para focar a busca',
          'Atalho ⌘K abre a busca rápida de qualquer página',
        ],
      },
      {
        titulo: 'Visualização e filtros',
        itens: [
          'Alterne entre Cards e Tabela com os botões no canto superior direito',
          'Ordene por relevância, nome ou valor com o seletor de ordenação',
          'Filtre por faixa de valores com o botão Filtros',
          'Ative Comparar para ver até 3 procedimentos lado a lado',
        ],
      },
      {
        titulo: 'Entendendo os valores',
        itens: [
          '"Total SUS" = SA (ambulatorial) + SH (hospitalar) + SP (profissional)',
          'Passe o mouse sobre o valor para ver o detalhamento por componente',
          'Permanência mínima indica quantos dias o paciente deve ficar internado para o pagamento integral',
        ],
      },
      {
        titulo: 'Favoritos e atalhos',
        itens: [
          'Clique na ⭐ para salvar um procedimento nos Favoritos',
          'Acesse seus favoritos pelo menu superior',
          'Clique no código para copiá-lo para a área de transferência',
        ],
      },
    ],
  },

  calculadora: {
    titulo: 'Como usar a Calculadora AIH',
    secoes: [
      {
        titulo: 'Montando a AIH',
        itens: [
          'Busque procedimentos pelo nome ou código SIGTAP na barra de busca',
          'Clique para adicionar à lista; repita para incluir múltiplos procedimentos',
          'Remova itens clicando no × ao lado de cada um',
        ],
      },
      {
        titulo: 'Lendo os valores',
        itens: [
          'Cada item mostra SA (ambulatorial), SH (hospitalar) e SP (profissional)',
          'O total acumulado aparece no rodapé — use como estimativa de faturamento',
          'Valores são da tabela SIGTAP vigente e podem variar conforme pactuação local',
        ],
      },
      {
        titulo: 'Exportação',
        itens: [
          'Clique em Exportar CSV para salvar a lista com valores em planilha',
        ],
      },
    ],
  },

  anamnese: {
    titulo: 'Como usar a Análise de Anamnese',
    secoes: [
      {
        titulo: 'Inserindo o texto clínico',
        itens: [
          'Cole o texto completo do paciente: queixas, dados vitais, exames e diagnóstico',
          'Quanto mais detalhado o texto, mais precisas serão as sugestões',
          'Use os exemplos disponíveis para explorar antes de inserir dados reais',
        ],
      },
      {
        titulo: 'Interpretando os resultados',
        itens: [
          'A IA identifica CIDs e sugere procedimentos SIGTAP compatíveis com o quadro',
          '"Principais" são os procedimentos de internação mais relevantes',
          'Clique em um CID para expandir os procedimentos vinculados àquele diagnóstico',
          'Os resultados são sugestões clínicas — sempre confirme com o médico responsável',
        ],
      },
      {
        titulo: 'Texto para AIH e próximos passos',
        itens: [
          'Copie o texto gerado pela IA para usar diretamente no sistema de AIH',
          'Use "Nova análise" para limpar e iniciar outra consulta',
          'Clique em qualquer procedimento para abrir a ficha completa no SIGTAP',
        ],
      },
    ],
  },

  hro: {
    titulo: 'Como usar o Guia PS HRO',
    secoes: [
      {
        titulo: 'Por especialidade',
        itens: [
          'Selecione uma especialidade na coluna esquerda para listar os procedimentos',
          'Clique em um procedimento para abrir os detalhes na coluna direita',
          'Barra verde = Grupo 03 — clínico (preferencial para AIH)',
          'Barra laranja = Grupo 04 — cirúrgico (verifique se o HRO tem FPO antes de usar)',
        ],
      },
      {
        titulo: 'Painel de detalhes',
        itens: [
          '"Ver completo" abre a página SIGTAP completa do procedimento',
          'CIDs compatíveis são buscados direto do banco SIGTAP',
          'Valores detalhados: Ambulatorial, Hospitalar, Profissional e Total SUS',
          '"Permanência mín." indica o número mínimo de dias para pagamento integral',
        ],
      },
      {
        titulo: 'Código rejeitado',
        itens: [
          'Insira um código recusado na AIH para ver a melhor alternativa do Grupo 03',
          'Exibe o motivo da rejeição e o código substituto recomendado para o HRO',
        ],
      },
      {
        titulo: 'Busca rápida',
        itens: [
          'Pesquise por diagnóstico clínico, sigla (ex: IAM, AVC) ou código SIGTAP',
        ],
      },
    ],
  },
}

// ── Componente ────────────────────────────────────────────────────────────────

export function HelpSheet({ pagina, open, onClose }) {
  const guide = GUIDES[pagina]
  if (!guide) return null

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <div className="pt-2 pb-8">
          {/* Título */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-slate-800">{guide.titulo}</h2>
            </div>
            <div className="h-px bg-slate-100 mt-3" />
          </div>

          {/* Seções */}
          <div className="space-y-6">
            {guide.secoes.map((s, i) => (
              <div key={i}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">{s.titulo}</p>
                <ul className="space-y-2">
                  {s.itens.map((item, j) => (
                    <li key={j} className="flex items-start gap-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                      <span className="text-sm text-slate-600 leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ── Botão de ajuda reutilizável ────────────────────────────────────────────────

export function HelpButton({ onClick, dark = false }) {
  return (
    <button
      onClick={onClick}
      className={dark
        ? 'flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/20 transition'
        : 'flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600 transition shadow-sm'
      }
      title="Como usar"
    >
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Como usar
    </button>
  )
}
