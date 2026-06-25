'use client'

/**
 * NovoAlunoPage — Thin Component (Apresentação pura).
 * Toda lógica vive no Fat Hook `useNovoAlunoForm`.
 */

import { AppShell } from '@/presentation/components/layout/AppShell'
import { ArrowLeft, Save, Info, Loader2, AlertCircle, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useNovoAlunoForm } from '@/application/hooks/useNovoAlunoForm'
import { usePapel } from '@/application/hooks/usePapel'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function NovoAlunoPage() {
  const router = useRouter()
  const usuario = usePapel()

  useEffect(() => {
    if (usuario?.papel === 'prof_apoio' || usuario?.papel === 'prof_regente') {
      router.replace('/alunos')
    }
  }, [usuario, router])

  const { register, errors, onSubmit, isSubmitting, erroGlobal, escolas, escolasLoading, professoresApoio, professoresLoading, escolaIdSelecionada } = useNovoAlunoForm()

  return (
    <AppShell title="Novo Aluno">
      <div className="max-w-3xl mx-auto p-6 lg:p-8 space-y-8">

        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex items-start sm:items-center gap-4">
          <Link 
            href="/alunos" 
            className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0 mt-1 sm:mt-0"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
              Novo Aluno
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Preencha os dados para iniciar o acompanhamento especializado.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">

          {/* ── Erro global ───────────────────────────────── */}
          {erroGlobal && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle size={16} className="text-red-600" />
              </div>
              <div className="pt-1.5">
                <p className="text-sm font-bold text-red-800">Erro ao salvar</p>
                <p className="text-sm text-red-700 mt-0.5">{erroGlobal}</p>
              </div>
            </div>
          )}

          {/* ── Card: Dados Pessoais ──────────────────────── */}
          <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Dados Pessoais</h3>
              <p className="text-sm text-slate-500 mt-1">Informações básicas de identificação do estudante.</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Nome */}
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  id="nome"
                  type="text"
                  placeholder="Ex: João da Silva Santos"
                  className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow ${
                    errors.nome ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300'
                  }`}
                  {...register('nome')}
                />
                {errors.nome && (
                  <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5 font-medium">
                    <AlertCircle size={12} />{errors.nome.message}
                  </p>
                )}
              </div>

              {/* Nascimento + Escola — 2 colunas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="nascimento" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Data de Nascimento <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="nascimento"
                    type="date"
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow ${
                      errors.nascimento ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300'
                    }`}
                    {...register('nascimento')}
                  />
                  {errors.nascimento && (
                    <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5 font-medium">
                      <AlertCircle size={12} />{errors.nascimento.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="escola_atual_id" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Escola <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="escola_atual_id"
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow cursor-pointer ${
                      errors.escola_atual_id ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300'
                    }`}
                    {...register('escola_atual_id')}
                    disabled={escolasLoading}
                  >
                    <option value="">
                      {escolasLoading ? 'Carregando...' : 'Selecione a escola'}
                    </option>
                    {escolas.map(e => (
                      <option key={e.id} value={e.id}>{e.nome}</option>
                    ))}
                  </select>
                  {errors.escola_atual_id && (
                    <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5 font-medium">
                      <AlertCircle size={12} />{errors.escola_atual_id.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Professora de Apoio */}
              {escolaIdSelecionada && (
                <div>
                  <label htmlFor="apoio_id" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Professora de Apoio
                  </label>
                  <select
                    id="apoio_id"
                    className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow cursor-pointer ${
                      errors.apoio_id ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-300'
                    }`}
                    {...register('apoio_id')}
                    disabled={professoresLoading || professoresApoio.length === 0}
                  >
                    <option value="">
                      {professoresLoading ? 'Carregando...' : professoresApoio.length === 0 ? 'Nenhuma prof. de apoio encontrada' : 'Selecione a professora'}
                    </option>
                    {professoresApoio.map(p => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                  {errors.apoio_id && (
                    <p className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5 font-medium">
                      <AlertCircle size={12} />{errors.apoio_id.message}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Card: Informações Clínicas ────────────────── */}
          <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-base font-bold text-slate-900">Informações Clínicas</h3>
              <p className="text-sm text-slate-500 mt-1">Dados sensíveis — acesso auditado (LGPD Art. 58 LDB).</p>
            </div>

            <div className="p-6">
              <label htmlFor="diagnostico" className="block text-sm font-medium text-slate-700 mb-1.5">
                Laudo / Diagnóstico Principal
              </label>
              <textarea
                id="diagnostico"
                rows={4}
                placeholder="Descreva as características clínicas e pedagógicas relevantes..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow resize-y min-h-[100px]"
                {...register('diagnostico')}
              />
              <p className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                <Info size={14} className="text-slate-400" />
                Visível apenas para profissionais autorizados.
              </p>
            </div>
          </div>

          {/* ── LGPD ─────────────────────────────────────── */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={16} className="text-blue-600" />
              <span className="text-sm font-bold text-blue-900">Consentimento LGPD</span>
            </div>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30 focus:ring-offset-0 transition-colors cursor-pointer"
                  {...register('lgpd')}
                />
              </div>
              <span className="text-sm text-blue-800 leading-relaxed select-none group-hover:text-blue-900 transition-colors">
                Confirmo que obtive o <strong className="font-semibold">consentimento do responsável legal</strong> para
                registro e tratamento dos dados deste estudante (Art. 58 LDB).
              </span>
            </label>
            {errors.lgpd && (
              <p className="flex items-center gap-1.5 text-xs text-red-500 mt-2.5 font-medium ml-7">
                <AlertCircle size={12} />{errors.lgpd.message}
              </p>
            )}
          </div>

          {/* ── Ações ────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link 
              href="/alunos" 
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </Link>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isSubmitting
                ? <Loader2 size={16} className="animate-spin" />
                : <Save size={16} />
              }
              {isSubmitting ? 'Salvando...' : 'Salvar Aluno'}
            </button>
          </div>
        </form>

      </div>
    </AppShell>
  )
}
