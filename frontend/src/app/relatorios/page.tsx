'use client'

import { AppShell } from '@/presentation/components/layout/AppShell'
import { ArrowLeft, Plus, FileText, FileSearch, FileCheck } from 'lucide-react'
import Link from 'next/link'
import { useReportTemplates } from '@/application/hooks/useReportTemplates'
import { usePapel } from '@/application/hooks/usePapel'

export default function RelatoriosPage() {
  const { templates, isLoading, error } = useReportTemplates()
  const papel = usePapel()
  const canCreate = papel !== 'prof_apoio' && papel !== 'prof_regente'

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
                Tipos de Relatório
              </h2>
              <p className="text-sm text-slate-500 mt-1">Gerencie os modelos de relatórios e PDIs dos alunos do AEE.</p>
            </div>
          </div>
          
          {canCreate && (
            <Link 
              href="/relatorios/novo-tipo" 
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-[0.98]"
            >
              <Plus size={18} />
              Novo Tipo de Relatório
            </Link>
          )}
        </div>

        {/* Cards por categoria */}
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm">
            {error}
          </div>
        ) : templates.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-slate-500 mb-4">Nenhum tipo de relatório cadastrado.</p>
            <Link href="/relatorios/novo-tipo" className="text-primary font-semibold hover:underline">
              Criar o primeiro
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all flex flex-col h-full group"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-primary transition-transform group-hover:scale-105">
                    <FileText size={24} />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{template.nome}</h3>
                <p className="text-sm text-slate-500 mt-1 mb-6 flex-1 leading-relaxed">{template.descricao}</p>
                <Link 
                  href={`/relatorios/${template.id}`} 
                  className="text-primary font-bold text-sm hover:underline flex items-center gap-1.5 self-start group-hover:gap-2 transition-all"
                >
                  Visualizar relatórios →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
