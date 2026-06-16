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
    <AppShell title="Relatórios">
      <div className="max-w-5xl mx-auto p-6 lg:p-8 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <Link 
              href="/dashboard" 
              className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0 mt-1 sm:mt-0"
              aria-label="Voltar"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                Documentação
              </h2>
              <p className="text-sm text-slate-500 mt-1">Gerencie relatórios e PDIs dos alunos do AEE.</p>
            </div>
          </div>
          
          <Link 
            href="/relatorios/novo" 
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-[0.98]"
          >
            <Plus size={18} />
            Novo Relatório
          </Link>
        </div>

        {/* Alert pendências */}
        <div className="flex items-center gap-3.5 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          </div>
          <p className="text-sm font-semibold text-red-800 leading-snug">
            5 PDIs vencidos precisam de atenção urgente
          </p>
        </div>

        {/* Cards por categoria */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {CATEGORIAS.map((cat) => {
            const Icon = cat.icon
            return (
              <div
                key={cat.title}
                className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col h-full group"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-primary transition-transform group-hover:scale-105">
                    <Icon size={24} />
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold shadow-sm ${
                    cat.badgeVariant === 'danger'  ? 'bg-red-50 text-red-700 border border-red-100' :
                    cat.badgeVariant === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}>
                    {cat.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{cat.title}</h3>
                <p className="text-sm text-slate-500 mt-1 mb-6 flex-1 leading-relaxed">{cat.subtitle}</p>
                <button className="text-primary font-bold text-sm hover:underline flex items-center gap-1.5 self-start group-hover:gap-2 transition-all">
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
