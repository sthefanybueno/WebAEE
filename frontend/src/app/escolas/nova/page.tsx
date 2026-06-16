'use client'

import { AppShell } from '@/presentation/components/layout/AppShell'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { useEscolaForm } from '@/application/hooks/useEscolaForm'
import { cn } from '@/presentation/utils/utils'

export default function NovaEscolaPage() {
  const { onSubmit, register, errors, isSubmitting, erroGlobal } = useEscolaForm()

  return (
    <AppShell title="Nova Escola">
      <div className="max-w-3xl mx-auto p-6 lg:p-8 space-y-6">
        
        {/* Header Section */}
        <div className="flex items-start sm:items-center gap-4 mb-8">
          <Link 
            href="/escolas" 
            className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0 mt-1 sm:mt-0"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
              Nova Escola
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Cadastre uma nova instituição na rede de ensino.
            </p>
          </div>
        </div>

        {/* Error State */}
        {erroGlobal && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-medium flex items-center gap-2">
            ⚠️ {erroGlobal}
          </div>
        )}

        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-6 sm:p-8">
          <form onSubmit={onSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label htmlFor="nome" className="block text-sm font-semibold text-slate-900">
                Nome da Instituição <span className="text-red-500">*</span>
              </label>
              <input
                id="nome"
                type="text"
                placeholder="Ex: E.M. Paulo Freire"
                {...register('nome')}
                className={cn(
                  "w-full px-4 py-3 bg-white border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow",
                  errors.nome 
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" 
                    : "border-slate-300 focus:border-primary"
                )}
              />
              {errors.nome && <p className="text-xs font-semibold text-red-500 mt-1.5">{errors.nome.message}</p>}
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link 
                href="/escolas"
                className="px-6 py-2.5 font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors text-sm"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-8 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isSubmitting ? 'Salvando...' : 'Salvar Escola'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
