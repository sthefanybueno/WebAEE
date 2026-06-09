import { AppShell } from '@/presentation/components/layout/AppShell'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

const CATEGORIAS = [
  { icon: 'ðŸ“‹', title: 'PDIs', subtitle: 'Planos individuais de desenvolvimento', badge: '5 pendentes', badgeVariant: 'danger' as const },
  { icon: 'ðŸ“', title: 'RelatÃ³rios DiÃ¡rios', subtitle: 'Registro cotidiano em sala de recurso', badge: '12 revisÃ£o', badgeVariant: 'warning' as const },
  { icon: 'ðŸ“Š', title: 'RelatÃ³rios Trimestrais', subtitle: 'Consolidado trimestral de metas', badge: 'Em dia âœ“', badgeVariant: 'success' as const },
]

export default function RelatoriosPage() {
  return (
    <AppShell
      role="prof_aee"
      header={
        <>
          <Link href="/dashboard" aria-label="Voltar" className="p-2 -ml-2 rounded-full hover:bg-[--color-primary-light] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-[18px] font-bold text-[--color-text-primary]">Meus RelatÃ³rios</h1>
          <div className="w-9" />
        </>
      }
    >
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h2 className="text-[22px] font-bold text-[--color-text-primary]">Painel de Controle</h2>
          <p className="text-[15px] text-[--color-text-secondary]">Gerencie a documentaÃ§Ã£o dos seus alunos do AEE.</p>
        </div>

        {/* Alert pendÃªncias crÃ­ticas */}
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
          <AlertTriangle size={18} className="text-[--color-status-danger] shrink-0 mt-0.5" />
          <p className="text-[15px] font-bold text-[--color-status-danger]">
            5 PDIs vencidos precisam de atenÃ§Ã£o urgente
          </p>
        </div>

        {/* Cards por categoria */}
        <div className="flex flex-col gap-4">
          {CATEGORIAS.map((cat) => (
            <div
              key={cat.title}
              className="bg-[--color-surface-card] rounded-2xl p-6 border border-[--color-border] shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{cat.icon}</span>
                <span className={`px-3 py-1 rounded-full text-[12px] font-bold ${
                  cat.badgeVariant === 'danger'  ? 'bg-red-100 text-[--color-status-danger]' :
                  cat.badgeVariant === 'warning' ? 'bg-amber-100 text-[--color-status-warning]' :
                  'bg-[--color-primary-light] text-[--color-primary]'
                }`}>
                  {cat.badge}
                </span>
              </div>
              <h3 className="text-[16px] font-bold text-[--color-text-primary] mb-1">{cat.title}</h3>
              <p className="text-[13px] text-[--color-text-secondary] mb-4">{cat.subtitle}</p>
              <Link href="/alunos" className="text-[--color-primary] font-bold text-[13px] hover:underline flex items-center gap-1">
                Ver lista â†’
              </Link>
            </div>
          ))}
        </div>

        {/* Novo relatÃ³rio */}
        <div className="flex flex-col items-center p-8 border-2 border-dashed border-[--color-border] rounded-2xl">
          <span className="text-4xl mb-3">ðŸ“„</span>
          <p className="text-[--color-text-secondary] font-bold mb-4">Novo documento?</p>
          <Link
            href="/alunos"
            className="min-h-[48px] px-8 bg-[--color-primary] hover:bg-[--color-primary-hover] text-white font-bold rounded-xl flex items-center justify-center transition-colors shadow-md"
          >
            Criar RelatÃ³rio
          </Link>
        </div>
      </div>
    </AppShell>
  )
}

