'use client'

import { AppShell } from '@/presentation/components/layout/AppShell'
import Link from 'next/link'
import { Plus, Building2, Loader2, ArrowLeft } from 'lucide-react'
import { useEscolas } from '@/application/hooks/useEscolas'

export default function EscolasPage() {
  const { escolas, isLoading, error } = useEscolas()

  return (
    <AppShell
      title="Escolas"
      header={
        <>
          <Link href="/dashboard" aria-label="Voltar" className="p-2 -ml-2 rounded-full hover:bg-[--color-primary-light] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-[18px] font-bold text-[--color-text-primary]">Escolas</h1>
          <div className="w-9" />
        </>
      }
    >
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[--color-text-primary]">Rede de Ensino</h2>
            <p className="text-[14px] text-[--color-text-secondary] mt-1">Gerencie as escolas associadas aos seus alunos.</p>
          </div>
          
          <Link 
            href="/escolas/nova" 
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[--color-primary] hover:bg-[--color-primary-hover] text-white font-bold rounded-xl transition-colors shadow-sm"
          >
            <Plus size={18} />
            Nova Escola
          </Link>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm font-medium flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        {/* Content Section */}
        <div className="bg-white border border-[--color-border] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[--color-text-secondary]">
              <Loader2 className="animate-spin mb-4 text-[--color-primary]" size={32} />
              <p className="font-medium">Carregando escolas...</p>
            </div>
          ) : escolas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-16 h-16 bg-[--color-surface] rounded-full flex items-center justify-center mb-4">
                <Building2 size={24} className="text-[--color-text-secondary]" />
              </div>
              <h3 className="text-lg font-bold text-[--color-text-primary] mb-1">Nenhuma escola cadastrada</h3>
              <p className="text-[14px] text-[--color-text-secondary] mb-6">Cadastre sua primeira escola para associar aos seus alunos.</p>
              <Link 
                href="/escolas/nova" 
                className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[--color-primary] text-[--color-primary] font-bold rounded-xl hover:bg-[--color-primary-light] transition-colors"
              >
                <Plus size={16} /> Cadastrar Escola
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[--color-surface] border-b border-[--color-border]">
                    <th className="px-6 py-4 text-[12px] font-bold text-[--color-text-secondary] uppercase tracking-wider">Escola</th>
                    <th className="px-6 py-4 text-[12px] font-bold text-[--color-text-secondary] uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--color-border]">
                  {escolas.map((escola) => (
                    <tr key={escola.id} className="hover:bg-[--color-surface] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[--color-primary-light] flex items-center justify-center text-[--color-primary] shrink-0">
                            <Building2 size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-[14px] text-[--color-text-primary] group-hover:text-[--color-primary] transition-colors">
                              {escola.nome}
                            </p>
                            <p className="text-[12px] text-[--color-text-secondary]">ID: {escola.id.split('-')[0]}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-[12px] font-semibold rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Ativa
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
