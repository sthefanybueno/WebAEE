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
          <Loader2 className="animate-spin text-[#1A6F45]" size={32} />
        </div>
      </AppShell>
    )
  }

  if (!aluno) {
    return (
      <AppShell title="Perfil do Aluno">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-xl font-bold text-[--color-text-primary]">Aluno não encontrado</p>
          <Link href="/alunos" className="mt-4 text-[#1A6F45] font-semibold hover:underline">← Voltar para lista</Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Perfil do Aluno">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px] text-[--color-text-secondary]">
          <Link href="/alunos" className="hover:text-[#1A6F45] transition-colors">Alunos</Link>
          <span>/</span>
          <span className="text-[--color-text-primary] font-medium">{aluno.nome}</span>
        </div>

        {/* Profile header */}
        <div className="bg-white border border-[--color-border] rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-5 shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-[#D1F0E0] flex items-center justify-center text-[#1A6F45] font-bold text-2xl shrink-0">
            {getInitials(aluno.nome)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-bold text-[--color-text-primary]">{aluno.nome}</h2>
                <p className="text-[--color-text-secondary] text-[14px] mt-0.5">
                  {aluno.escola_atual}
                  {aluno.data_nascimento && ` • ${new Date(aluno.data_nascimento).toLocaleDateString('pt-BR')}`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {aluno.sync_status === 'pending' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-200 text-orange-700 text-[12px] font-semibold rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                    Aguardando sync
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-[12px] font-semibold rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {aluno.status === 'ativo' ? 'Ativo' : 'Arquivado'}
                </span>
              </div>
            </div>

            {/* Main CTA */}
            <div className="flex flex-wrap gap-3 mt-4">
              <Link
                href={`/relatorios/novo?aluno_id=${aluno.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A6F45] hover:bg-[#155838] text-white font-semibold rounded-xl shadow-sm transition-all text-[14px]"
              >
                <FileText size={16} />
                Relatório de Hoje
              </Link>
              <Link
                href="/momentos/registrar"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[--color-border] text-[--color-text-primary] font-semibold rounded-xl hover:bg-[--color-surface] transition-all text-[14px]"
              >
                <Camera size={16} />
                Registrar Momento
              </Link>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Laudo + Horários */}
          <div className="lg:col-span-2 space-y-5">

            {/* Laudo */}
            {aluno.diagnostico && (
              <div className="bg-white border border-[--color-border] rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-[--color-border] bg-[--color-surface] flex items-center justify-between">
                  <h3 className="font-bold text-[--color-text-primary]">Laudo / Diagnóstico</h3>
                  <button className="text-[12px] text-[#1A6F45] font-semibold hover:underline flex items-center gap-1">
                    <Edit size={12} /> Editar
                  </button>
                </div>
                <div className="p-5">
                  <p className="text-[14px] text-[--color-text-secondary] leading-relaxed">{aluno.diagnostico}</p>
                  <p className="mt-3 text-[11px] text-[--color-text-secondary] bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
                    🔒 Campo sensível — acesso auditado por LGPD Art. 58 LDB
                  </p>
                </div>
              </div>
            )}

            {/* Ações rápidas */}
            <div className="bg-white border border-[--color-border] rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[--color-border] bg-[--color-surface]">
                <h3 className="font-bold text-[--color-text-primary]">Registros</h3>
              </div>
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link
                  href="/momentos/registrar"
                  className="flex items-center gap-3 p-4 rounded-xl border border-[--color-border] hover:border-[#1A6F45]/40 hover:bg-[--color-surface] transition-all group"
                >
                  <div className="w-10 h-10 bg-[#D1F0E0] rounded-xl flex items-center justify-center">
                    <Camera size={18} className="text-[#1A6F45]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[14px] text-[--color-text-primary] group-hover:text-[#1A6F45] transition-colors">Registrar Momento</p>
                    <p className="text-[12px] text-[--color-text-secondary]">Captura fotográfica pedagógica</p>
                  </div>
                </Link>
                <Link
                  href="/horarios"
                  className="flex items-center gap-3 p-4 rounded-xl border border-[--color-border] hover:border-[#1A6F45]/40 hover:bg-[--color-surface] transition-all group"
                >
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Clock size={18} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-[14px] text-[--color-text-primary] group-hover:text-[#1A6F45] transition-colors">Ver Horários</p>
                    <p className="text-[12px] text-[--color-text-secondary]">Grade de atendimentos</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Right: Info sidebar */}
          <div className="space-y-5">
            <div className="bg-white border border-[--color-border] rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-[--color-border] bg-[--color-surface]">
                <h3 className="font-bold text-[--color-text-primary]">Informações</h3>
              </div>
              <dl className="divide-y divide-[--color-border]">
                {[
                  { label: 'Escola', value: aluno.escola_atual || '—' },
                  { label: 'Nascimento', value: aluno.data_nascimento ? new Date(aluno.data_nascimento).toLocaleDateString('pt-BR') : '—' },
                  { label: 'Status', value: aluno.status || '—' },
                  { label: 'Sincronização', value: aluno.sync_status === 'pending' ? 'Pendente' : 'Atualizado' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between px-5 py-3">
                    <dt className="text-[13px] text-[--color-text-secondary]">{label}</dt>
                    <dd className="text-[13px] font-semibold text-[--color-text-primary] text-right">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <Link
              href="/alunos"
              className="flex items-center gap-2 text-[13px] text-[--color-text-secondary] hover:text-[#1A6F45] transition-colors"
            >
              <ArrowLeft size={14} /> Voltar para lista
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

