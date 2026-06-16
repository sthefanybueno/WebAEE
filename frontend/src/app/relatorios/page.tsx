'use client'

import { AppShell } from '@/presentation/components/layout/AppShell'
import { ArrowLeft, Plus, FileText, FileSearch, FileCheck } from 'lucide-react'
import Link from 'next/link'

const CATEGORIAS = [
  { icon: FileSearch, title: 'PDIs', subtitle: 'Planos individuais de desenvolvimento', badge: '5 pendentes', badgeVariant: 'danger' as const },
  { icon: FileText, title: 'Relatórios Diários', subtitle: 'Registro cotidiano em sala de recurso', badge: '12 revisão', badgeVariant: 'warning' as const },
  { icon: FileCheck, title: 'Relatórios Trimestrais', subtitle: 'Consolidado trimestral de metas', badge: 'Em dia', badgeVariant: 'success' as const },
]

export default function RelatoriosPage() {
  return (
    <AppShell
      title="Relatórios"
      header={
        <>
          <Link href="/dashboard" aria-label="Voltar" className="p-2 -ml-2 rounded-full hover:bg-[--color-primary-light] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-[18px] font-bold text-[--color-text-primary]">Meus Relatórios</h1>
          <div className="w-9" />
        </>
      }
    >
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[--color-text-primary]">Documentação</h2>
            <p className="text-[14px] text-[--color-text-secondary] mt-1">Gerencie relatórios e PDIs dos alunos do AEE.</p>
          </div>
          
          <Link 
            href="/relatorios/novo" 
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[--color-primary] hover:bg-[--color-primary-hover] text-white font-bold rounded-xl transition-colors shadow-sm"
          >
            <Plus size={18} />
            Novo Relatório
          </Link>
        </div>

        {/* Alert pendências */}
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </div>
          <p className="text-[14px] font-bold text-red-800">
            5 PDIs vencidos precisam de atenção urgente
          </p>
        </div>

        {/* Cards por categoria */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CATEGORIAS.map((cat) => {
            const Icon = cat.icon
            return (
              <div
                key={cat.title}
                className="bg-white border border-[--color-border] rounded-2xl p-5 shadow-sm hover:border-[--color-primary]/30 transition-all flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[--color-primary-light] flex items-center justify-center text-[--color-primary]">
                    <Icon size={20} />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    cat.badgeVariant === 'danger'  ? 'bg-red-50 text-red-700 border border-red-100' :
                    cat.badgeVariant === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    'bg-green-50 text-green-700 border border-green-100'
                  }`}>
                    {cat.badge}
                  </span>
                </div>
                <h3 className="text-[16px] font-bold text-[--color-text-primary]">{cat.title}</h3>
                <p className="text-[13px] text-[--color-text-secondary] mt-1 mb-4 flex-1">{cat.subtitle}</p>
                <button className="text-[--color-primary] font-bold text-[13px] hover:underline flex items-center gap-1 self-start">
                  Visualizar →
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
