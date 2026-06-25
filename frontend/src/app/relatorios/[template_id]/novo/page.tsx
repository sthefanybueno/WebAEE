'use client'

import { AppShell } from '@/presentation/components/layout/AppShell'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { useDynamicRelatorioForm } from '@/application/hooks/useDynamicRelatorioForm'
import { cn } from '@/presentation/utils/utils'
import { useParams, useRouter } from 'next/navigation'
import { usePapel } from '@/application/hooks/usePapel'
import { useEffect } from 'react'

export default function NovoRelatorioDinamicoPage() {
  const params = useParams()
  const template_id = params.template_id as string
  
  const {
    template, templateLoading,
    alunos, alunosLoading,
    formData, handleChange, handleConteudoChange,
    isSubmitting, erroGlobal, onSubmit
  } = useDynamicRelatorioForm(template_id)

  const dadosUsuario = usePapel()
  const router = useRouter()



  if (templateLoading) {
    return (
      <AppShell title="Carregando...">
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="animate-spin text-primary w-8 h-8" />
        </div>
      </AppShell>
    )
  }

  if (!template) {
    return (
      <AppShell title="Erro">
        <div className="p-6">Template não encontrado.</div>
      </AppShell>
    )
  }

  return (
    <AppShell title={`Novo ${template.nome}`}>
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:py-8 space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="flex items-start sm:items-center gap-4">
            <Link 
              href={`/relatorios/${template_id}`} 
              className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0 mt-1 sm:mt-0"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                Novo {template.nome}
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
                    required
                    value={formData.aluno_id}
                    onChange={(e) => handleChange('aluno_id', e.target.value)}
                    disabled={alunosLoading}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none transition-shadow appearance-none text-sm cursor-pointer disabled:bg-slate-50 disabled:text-slate-500 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Selecione um aluno</option>
                    {alunos?.map(a => (
                      <option key={a.id} value={a.id}>{a.nome}</option>
                    ))}
                  </select>
                  {alunosLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-primary" size={16} />}
                </div>
              </div>

              {/* Data */}
              <div className="space-y-2">
                <label htmlFor="data" className="block text-sm font-semibold text-slate-900">
                  Data <span className="text-red-500">*</span>
                </label>
                <input
                  id="data"
                  type="date"
                  required
                  value={formData.data}
                  onChange={(e) => handleChange('data', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none transition-shadow focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
              </div>
            </div>

            {/* Campos Dinâmicos */}
            {template.secoes?.campos?.map((campo: any) => (
              <div key={campo.id} className="space-y-2">
                <label htmlFor={campo.id} className="block text-sm font-semibold text-slate-900">
                  {campo.label} <span className="text-red-500">*</span>
                </label>
                
                {campo.tipo === 'textarea' ? (
                  <textarea
                    id={campo.id}
                    required
                    rows={4}
                    value={formData.conteudo[campo.id] || ''}
                    onChange={e => handleConteudoChange(campo.id, e.target.value)}
                    className="w-full p-4 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none transition-shadow resize-y focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                ) : campo.tipo === 'date' ? (
                  <input
                    id={campo.id}
                    type="date"
                    required
                    value={formData.conteudo[campo.id] || ''}
                    onChange={e => handleConteudoChange(campo.id, e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none transition-shadow focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                ) : campo.tipo === 'number' ? (
                  <input
                    id={campo.id}
                    type="number"
                    required
                    value={formData.conteudo[campo.id] || ''}
                    onChange={e => handleConteudoChange(campo.id, e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none transition-shadow focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                ) : (
                  <input
                    id={campo.id}
                    type="text"
                    required
                    value={formData.conteudo[campo.id] || ''}
                    onChange={e => handleConteudoChange(campo.id, e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none transition-shadow focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  />
                )}
              </div>
            ))}

            <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-3">
              <Link 
                href={`/relatorios/${template_id}`}
                className="w-full sm:w-auto px-6 py-3 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl transition-all active:scale-[0.98]"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isSubmitting ? 'Salvando...' : 'Salvar Relatório'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
