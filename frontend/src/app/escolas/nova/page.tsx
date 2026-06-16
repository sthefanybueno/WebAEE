'use client'

import { AppShell } from '@/presentation/components/layout/AppShell'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { useEscolaForm } from '@/application/hooks/useEscolaForm'
import { cn } from '@/presentation/utils/utils'

export default function NovaEscolaPage() {
  const { onSubmit, register, errors, isSubmitting, erroGlobal } = useEscolaForm()

  return (
    <AppShell
      title="Nova Escola"
      header={
        <>
          <Link href="/escolas" aria-label="Voltar" className="p-2 -ml-2 rounded-full hover:bg-[--color-primary-light] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-[18px] font-bold text-[--color-text-primary]">Nova Escola</h1>
          <div className="w-9" />
        </>
      }
    >
      <div className="max-w-2xl mx-auto px-6 py-8">
        
        {/* Error State */}
        {erroGlobal && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm font-medium flex items-center gap-2">
            ⚠️ {erroGlobal}
          </div>
        )}

        <div className="bg-white border border-[--color-border] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-6">
          <form onSubmit={onSubmit} className="space-y-6">
            
            <div className="space-y-1.5">
              <label htmlFor="nome" className="text-[14px] font-bold text-[--color-text-primary]">
                Nome da Instituição <span className="text-red-500">*</span>
              </label>
              <input
                id="nome"
                type="text"
                placeholder="Ex: E.M. Paulo Freire"
                {...register('nome')}
                className={cn(
                  "w-full h-12 px-4 rounded-xl border bg-[--color-surface] outline-none transition-colors text-[15px]",
                  errors.nome 
                    ? "border-red-400 focus:border-red-500" 
                    : "border-[--color-border] focus:border-[--color-primary]"
                )}
              />
              {errors.nome && <p className="text-[12px] font-semibold text-red-500 mt-1">{errors.nome.message}</p>}
            </div>

            <div className="pt-4 border-t border-[--color-border] flex items-center justify-end gap-3">
              <Link 
                href="/escolas"
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
                {isSubmitting ? 'Salvando...' : 'Salvar Escola'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
