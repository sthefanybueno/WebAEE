'use client'

import { AppShell } from '@/presentation/components/layout/AppShell'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { useRelatorioForm } from '@/application/hooks/useRelatorioForm'
import { cn } from '@/presentation/utils/utils'

import { Suspense } from 'react'

function NovoRelatorioContent() {
  const { form, onSubmit, register, errors, isSubmitting, erroGlobal, alunos, alunosLoading } = useRelatorioForm()

  return (
    <AppShell title="Novo Documento">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:py-8 space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-start sm:items-center gap-4">
            <Link 
              href="/relatorios" 
              className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0 mt-1 sm:mt-0"
              aria-label="Voltar"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                Novo Documento
              </h2>
            </div>
          </div>
        </div>
        
        {erroGlobal && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <span className="text-red-600 shrink-0 mt-0.5 text-sm">⚠️</span>
            <p className="text-sm font-semibold text-red-800 leading-snug">{erroGlobal}</p>
          </div>
        )}

        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <form onSubmit={onSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Aluno */}
              <div className="space-y-2">
                <label htmlFor="aluno_id" className="block text-sm font-semibold text-slate-900">
                  Aluno <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="aluno_id"
                    {...register('aluno_id')}
                    disabled={alunosLoading}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl border bg-white text-slate-900 outline-none transition-shadow appearance-none text-sm cursor-pointer disabled:bg-slate-50 disabled:text-slate-500",
                      errors.aluno_id 
                        ? "border-red-400 focus:ring-2 focus:ring-red-100" 
                        : "border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    )}
                  >
                    <option value="">Selecione um aluno</option>
                    {alunos?.map(a => (
                      <option key={a.id} value={a.id}>{a.nome}</option>
                    ))}
                  </select>
                  {alunosLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-primary" size={16} />}
                </div>
                {errors.aluno_id && <p className="text-xs font-semibold text-red-500 mt-1">{errors.aluno_id.message}</p>}
              </div>

              {/* Data */}
              <div className="space-y-2">
                <label htmlFor="data" className="block text-sm font-semibold text-slate-900">
                  Data <span className="text-red-500">*</span>
                </label>
                <input
                  id="data"
                  type="date"
                  {...register('data')}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl border bg-white text-slate-900 outline-none transition-shadow text-sm",
                    errors.data 
                      ? "border-red-400 focus:ring-2 focus:ring-red-100" 
                      : "border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  )}
                />
                {errors.data && <p className="text-xs font-semibold text-red-500 mt-1">{errors.data.message}</p>}
              </div>
            </div>

            {/* Tipo de Documento */}
            <div className="space-y-2">
              <label htmlFor="tipo" className="block text-sm font-semibold text-slate-900">
                Tipo de Documento <span className="text-red-500">*</span>
              </label>
              <select
                id="tipo"
                {...register('tipo')}
                className={cn(
                  "w-full px-4 py-3 rounded-xl border bg-white text-slate-900 outline-none transition-shadow appearance-none text-sm cursor-pointer",
                  errors.tipo 
                    ? "border-red-400 focus:ring-2 focus:ring-red-100" 
                    : "border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                )}
              >
                <option value="diario">Relatório Diário de Atendimento</option>
                <option value="pdi">Plano de Desenvolvimento Individual (PDI)</option>
                <option value="trimestral">Relatório de Evolução Trimestral</option>
              </select>
              {errors.tipo && <p className="text-xs font-semibold text-red-500 mt-1">{errors.tipo.message}</p>}
            </div>

            {/* Conteúdo */}
            <div className="space-y-2">
              <label htmlFor="conteudo" className="block text-sm font-semibold text-slate-900">
                Conteúdo do Relatório <span className="text-red-500">*</span>
              </label>
              <textarea
                id="conteudo"
                placeholder="Descreva as atividades, observações e avanços do aluno..."
                rows={8}
                {...register('conteudo')}
                className={cn(
                  "w-full p-4 rounded-xl border bg-white text-slate-900 outline-none transition-shadow resize-y text-sm leading-relaxed placeholder:text-slate-400",
                  errors.conteudo 
                    ? "border-red-400 focus:ring-2 focus:ring-red-100" 
                    : "border-slate-300 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                )}
              />
              {errors.conteudo && <p className="text-xs font-semibold text-red-500 mt-1">{errors.conteudo.message}</p>}
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
              <Link 
                href="/relatorios"
                className="w-full sm:w-auto px-6 py-3 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl transition-all active:scale-[0.98]"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isSubmitting ? 'Salvando...' : 'Salvar Documento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  )
}

export default function NovoRelatorioPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-primary" size={32} /></div>}>
      <NovoRelatorioContent />
    </Suspense>
  )
}
