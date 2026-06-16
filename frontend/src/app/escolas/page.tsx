'use client'

import { AppShell } from '@/presentation/components/layout/AppShell'
import Link from 'next/link'
import { Plus, Building2, Loader2, ArrowLeft } from 'lucide-react'
import { useEscolas } from '@/application/hooks/useEscolas'

export default function EscolasPage() {
  const { escolas, isLoading, error } = useEscolas()

  return (
    <AppShell title="Escolas">
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
                Rede de Ensino
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Gerencie as escolas associadas aos seus alunos.
              </p>
            </div>
          </div>
          
          <Link 
            href="/escolas/nova" 
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-[0.98]"
          >
            <Plus size={16} />
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
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="animate-spin mb-4 text-slate-400" size={32} />
              <p className="font-medium text-sm">Carregando escolas...</p>
            </div>
          ) : escolas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mb-6">
                <Building2 size={28} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhuma escola cadastrada</h3>
              <p className="text-sm text-slate-500 mb-8 max-w-sm">Cadastre sua primeira escola para associar aos seus alunos.</p>
              <Link 
                href="/escolas/nova" 
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-[0.98]"
              >
                <Plus size={16} /> Cadastrar Escola
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Escola</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {escolas.map((escola) => (
                    <tr key={escola.id} className="hover:bg-slate-50/80 transition-colors duration-150 group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-primary shrink-0">
                            <Building2 size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-slate-900 group-hover:text-primary transition-colors">
                              {escola.nome}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">ID: {escola.id.split('-')[0]}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-glow-pulse" /> Ativa
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
