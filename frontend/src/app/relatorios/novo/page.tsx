'use client'

import { AppShell } from '@/presentation/components/layout/AppShell'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { useRelatorioForm } from '@/application/hooks/useRelatorioForm'
import { cn } from '@/presentation/utils/utils'

export default function NovoRelatorioPage() {
  const { form, onSubmit, register, errors, isSubmitting, erroGlobal, alunos, alunosLoading } = useRelatorioForm()

  return (
    <AppShell
      title="Novo Documento"
      header={
        <>
          <Link href="/relatorios" aria-label="Voltar" className="p-2 -ml-2 rounded-full hover:bg-[--color-primary-light] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-[18px] font-bold text-[--color-text-primary]">Novo Documento</h1>
          <div className="w-9" />
        </>
      }
    >
      <div className="max-w-3xl mx-auto px-6 py-8">
        
        {erroGlobal && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-medium flex items-center gap-2">
            ⚠️ {erroGlobal}
          </div>
        )}

        <div className="bg-white border border-[--color-border] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6">
          <form onSubmit={onSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Aluno */}
              <div className="space-y-1.5">
                <label htmlFor="aluno_id" className="text-[14px] font-bold text-[--color-text-primary]">
                  Aluno <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="aluno_id"
                    {...register('aluno_id')}
                    disabled={alunosLoading}
                    className={cn(
                      "w-full h-12 px-4 rounded-xl border bg-[--color-surface] outline-none transition-colors appearance-none text-[15px]",
                      errors.aluno_id ? "border-red-400 focus:border-red-500" : "border-[--color-border] focus:border-[--color-primary]",
                      alunosLoading && "opacity-60"
                    )}
                  >
                    <option value="">Selecione um aluno</option>
                    {alunos?.map(a => (
                      <option key={a.id} value={a.id}>{a.nome}</option>
                    ))}
                  </select>
                  {alunosLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[--color-primary]" size={16} />}
                </div>
                {errors.aluno_id && <p className="text-[12px] font-semibold text-red-500 mt-1">{errors.aluno_id.message}</p>}
              </div>

              {/* Data */}
              <div className="space-y-1.5">
                <label htmlFor="data" className="text-[14px] font-bold text-[--color-text-primary]">
                  Data <span className="text-red-500">*</span>
                </label>
                <input
                  id="data"
                  type="date"
                  {...register('data')}
                  className={cn(
                    "w-full h-12 px-4 rounded-xl border bg-[--color-surface] outline-none transition-colors text-[15px]",
                    errors.data ? "border-red-400 focus:border-red-500" : "border-[--color-border] focus:border-[--color-primary]"
                  )}
                />
                {errors.data && <p className="text-[12px] font-semibold text-red-500 mt-1">{errors.data.message}</p>}
              </div>
            </div>

            {/* Tipo de Documento */}
            <div className="space-y-1.5">
              <label htmlFor="tipo" className="text-[14px] font-bold text-[--color-text-primary]">
                Tipo de Documento <span className="text-red-500">*</span>
              </label>
              <select
                id="tipo"
                {...register('tipo')}
                className={cn(
                  "w-full h-12 px-4 rounded-xl border bg-[--color-surface] outline-none transition-colors appearance-none text-[15px]",
                  errors.tipo ? "border-red-400 focus:border-red-500" : "border-[--color-border] focus:border-[--color-primary]"
                )}
              >
                <option value="diario">Relatório Diário de Atendimento</option>
                <option value="pdi">Plano de Desenvolvimento Individual (PDI)</option>
                <option value="trimestral">Relatório de Evolução Trimestral</option>
              </select>
              {errors.tipo && <p className="text-[12px] font-semibold text-red-500 mt-1">{errors.tipo.message}</p>}
            </div>

            {/* Conteúdo */}
            <div className="space-y-1.5">
              <label htmlFor="conteudo" className="text-[14px] font-bold text-[--color-text-primary]">
                Conteúdo do Relatório <span className="text-red-500">*</span>
              </label>
              <textarea
                id="conteudo"
                placeholder="Descreva as atividades, observações e avanços do aluno..."
                rows={8}
                {...register('conteudo')}
                className={cn(
                  "w-full p-4 rounded-xl border bg-[--color-surface] outline-none transition-colors resize-y text-[15px] leading-relaxed",
                  errors.conteudo ? "border-red-400 focus:border-red-500" : "border-[--color-border] focus:border-[--color-primary]"
                )}
              />
              {errors.conteudo && <p className="text-[12px] font-semibold text-red-500 mt-1">{errors.conteudo.message}</p>}
            </div>

            <div className="pt-4 border-t border-[--color-border] flex items-center justify-end gap-3">
              <Link 
                href="/relatorios"
                className="px-6 h-12 flex items-center justify-center font-bold text-[--color-text-secondary] hover:bg-[--color-surface] rounded-xl transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 h-12 flex items-center justify-center gap-2 bg-[--color-primary] hover:bg-[--color-primary-hover] text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
