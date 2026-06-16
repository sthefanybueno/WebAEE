'use client'

import { AppShell } from '@/presentation/components/layout/AppShell'
import { ArrowLeft, Camera, FileText, Clock, Loader2, Edit } from 'lucide-react'
import Link from 'next/link'
import { getInitials } from '@/presentation/utils/utils'
import { useAluno } from '@/application/hooks/useAlunos'
import { useParams } from 'next/navigation'

export default function AlunoPerfilPage() {
  const params = useParams()
  const id = params.id as string
  const { aluno, loading } = useAluno(id)

  if (loading) {
    return (
      <AppShell title="Perfil do Aluno">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </AppShell>
    )
  }

  if (!aluno) {
    return (
      <AppShell title="Perfil do Aluno">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-xl font-bold text-slate-900">Aluno não encontrado</p>
          <Link href="/alunos" className="mt-4 text-primary font-semibold hover:underline">
            ← Voltar para lista
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Perfil do Aluno">
      <div className="max-w-5xl mx-auto p-6 lg:p-8 space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/alunos" className="hover:text-primary transition-colors">Alunos</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-medium">{aluno.nome}</span>
        </div>

        {/* Profile header */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 lg:p-8 flex flex-col sm:flex-row items-start gap-6 shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-primary-light flex items-center justify-center text-primary font-bold text-2xl shrink-0">
            {getInitials(aluno.nome)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">{aluno.nome}</h2>
                <p className="text-slate-500 text-sm mt-1">
                  {aluno.escola_atual}
                  {aluno.data_nascimento && ` • ${new Date(aluno.data_nascimento).toLocaleDateString('pt-BR')}`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {aluno.sync_status === 'local' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Aguardando sync
                  </span>
                )}
                {aluno.sync_status === 'failed' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Falha no sync
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full">
                  <span className={`w-1.5 h-1.5 rounded-full ${aluno.status === 'ativo' ? 'bg-emerald-500 animate-glow-pulse' : 'bg-slate-400'}`} />
                  {aluno.status === 'ativo' ? 'Ativo' : 'Arquivado'}
                </span>
              </div>
            </div>

            {/* Main CTA */}
            <div className="flex flex-wrap gap-3 mt-6">
              <Link
                href={`/relatorios/novo?aluno_id=${aluno.id}`}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-[0.98]"
              >
                <FileText size={18} />
                Relatório de Hoje
              </Link>
              <Link
                href="/momentos/registrar"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all text-sm shadow-sm active:scale-[0.98]"
              >
                <Camera size={18} />
                Registrar Momento
              </Link>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Laudo + Horários */}
          <div className="lg:col-span-2 space-y-6">

            {/* Laudo */}
            {aluno.diagnostico && (
              <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">Laudo / Diagnóstico</h3>
                  <button className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                    <Edit size={14} /> Editar
                  </button>
                </div>
                <div className="p-6">
                  <p className="text-sm text-slate-600 leading-relaxed">{aluno.diagnostico}</p>
                  <p className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg font-medium inline-flex items-center gap-1.5">
                    <span className="text-amber-500">🔒</span> Campo sensível — acesso auditado por LGPD Art. 58 LDB
                  </p>
                </div>
              </div>
            )}

            {/* Ações rápidas */}
            <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-900">Registros</h3>
              </div>
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/momentos/registrar"
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-primary/40 hover:bg-slate-50 hover:shadow-sm transition-all group"
                >
                  <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center">
                    <Camera size={22} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 group-hover:text-primary transition-colors">Registrar Momento</p>
                    <p className="text-xs text-slate-500 mt-0.5">Captura fotográfica pedagógica</p>
                  </div>
                </Link>
                <Link
                  href="/horarios"
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-primary/40 hover:bg-slate-50 hover:shadow-sm transition-all group"
                >
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Clock size={22} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 group-hover:text-primary transition-colors">Ver Horários</p>
                    <p className="text-xs text-slate-500 mt-0.5">Grade de atendimentos</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Info sidebar */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-900">Informações</h3>
              </div>
              <dl className="divide-y divide-slate-100">
                {[
                  { label: 'Escola', value: aluno.escola_atual || '—' },
                  { label: 'Nascimento', value: aluno.data_nascimento ? new Date(aluno.data_nascimento).toLocaleDateString('pt-BR') : '—' },
                  { label: 'Status', value: aluno.status || '—', capitalize: true },
                  { label: 'Sincronização', value: aluno.sync_status === 'local' ? 'Aguardando' : aluno.sync_status === 'failed' ? 'Falhou' : 'Atualizado' },
                ].map(({ label, value, capitalize }) => (
                  <div key={label} className="flex items-center justify-between px-6 py-4">
                    <dt className="text-sm text-slate-500">{label}</dt>
                    <dd className={`text-sm font-semibold text-slate-900 text-right ${capitalize ? 'capitalize' : ''}`}>
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <Link
              href="/alunos"
              className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors w-full px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
            >
              <ArrowLeft size={16} /> Voltar para lista
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
