'use client'

import { AppShell } from '@/presentation/components/layout/AppShell'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, Plus, Trash2 } from 'lucide-react'
import { useReportTemplateForm } from '@/application/hooks/useReportTemplateForm'
import { cn } from '@/presentation/utils/utils'

export default function NovoTipoRelatorioPage() {
  const {
    nome, setNome,
    descricao, setDescricao,
    campos, addCampo, removeCampo, updateCampo,
    isSubmitting, erroGlobal, onSubmit
  } = useReportTemplateForm()

  return (
    <AppShell title="Novo Tipo de Relatório">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:py-8 space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="flex items-start sm:items-center gap-4">
            <Link 
              href="/relatorios" 
              className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0 mt-1 sm:mt-0"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                Novo Tipo de Relatório
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
            
            <div className="space-y-2">
              <label htmlFor="nome" className="block text-sm font-semibold text-slate-900">
                Nome do Relatório <span className="text-red-500">*</span>
              </label>
              <input
                id="nome"
                required
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: PDI"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none transition-shadow focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="descricao" className="block text-sm font-semibold text-slate-900">
                Descrição <span className="text-red-500">*</span>
              </label>
              <textarea
                id="descricao"
                required
                rows={3}
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Ex: Adaptações feitas pelos professores..."
                className="w-full p-4 rounded-xl border border-slate-300 bg-white text-slate-900 outline-none transition-shadow resize-y focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Campos do Formulário</h3>
                <button
                  type="button"
                  onClick={addCampo}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
                >
                  <Plus size={16} /> Adicionar Campo
                </button>
              </div>

              <div className="space-y-3">
                {campos.map((campo, index) => (
                  <div key={campo.id} className="flex gap-3 items-start bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex-1 space-y-2">
                      <input
                        required
                        value={campo.label}
                        onChange={e => updateCampo(campo.id, { label: e.target.value })}
                        placeholder="Nome do campo (ex: Assunto, Nível de Aprendizagem)"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-primary"
                      />
                    </div>
                    <div className="w-32 space-y-2">
                      <select
                        value={campo.tipo}
                        onChange={e => updateCampo(campo.id, { tipo: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-primary bg-white"
                      >
                        <option value="text">Texto Curto</option>
                        <option value="textarea">Texto Longo</option>
                        <option value="date">Data</option>
                        <option value="number">Número</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCampo(campo.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-0.5"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
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
                className="w-full sm:w-auto px-8 py-3 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isSubmitting ? 'Salvando...' : 'Salvar Tipo de Relatório'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppShell>
  )
}
