'use client'

import { AppShell } from '@/presentation/components/layout/AppShell'
import { ArrowLeft, Camera, FileText, Images, Loader2, Edit, Archive, PlayCircle } from 'lucide-react'
import Link from 'next/link'
import { getInitials } from '@/presentation/utils/utils'
import { useAluno } from '@/application/hooks/useAlunos'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { apiClient } from '@/infrastructure/http/client'
import { db } from '@/infrastructure/db/db'

export default function AlunoPerfilPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { aluno, loading } = useAluno(id)
  
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  const [apoioNome, setApoioNome] = useState<string>('Carregando...')

  useEffect(() => {
    if (aluno && (aluno as any).apoio_id) {
      // Buscar o nome da professora de apoio
      apiClient.get<any>('/api/usuarios/')
        .then(res => {
          const prof = (res?.items || []).find((u: any) => u.id === (aluno as any).apoio_id)
          setApoioNome(prof ? prof.nome : 'Desconhecida')
        })
        .catch(() => setApoioNome('Erro ao carregar'))
    } else {
      setApoioNome('—')
    }
  }, [aluno])

  const handleToggleStatus = async () => {
    if (!aluno) return
    try {
      setIsUpdatingStatus(true)
      const isAtivo = aluno.status === 'ativo'
      const endpoint = isAtivo ? 'arquivar' : 'ativar'
      const newStatus = isAtivo ? 'arquivado' : 'ativo'
      
      const targetId = aluno.server_id || aluno.id
      
      // Chamada na API se tiver sincronizado ou recém-criado
      if (aluno.server_id) {
        await apiClient.post(`/api/alunos/${aluno.server_id}/${endpoint}`, {})
      }
      
      // Atualiza localmente no Dexie para refletir na UI imediatamente
      if (aluno.id) {
        await db.alunos.update(aluno.id, { status: newStatus as any })
      }
      
      setShowStatusModal(false)
    } catch (err: any) {
      if (err?.statusCode === 404) {
        // O aluno foi excluído permanentemente no servidor, mas ainda estava no cache local
        if (aluno.id) {
          await db.alunos.delete(aluno.id)
        }
        setShowStatusModal(false)
        router.push('/alunos')
        return
      }
      console.error(err)
      alert('Erro ao alterar status do aluno.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

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

  const isAtivo = aluno.status === 'ativo'

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
                href={`/alunos/${aluno.id}/editar`}
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-[0.98]"
              >
                <Edit size={18} />
                Editar Perfil
              </Link>
              <Link
                href={`/momentos/registrar?aluno_id=${aluno.server_id || aluno.id}`}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-[0.98]"
              >
                <Camera size={18} />
                Registrar Momento
              </Link>
              <button
                onClick={() => setShowStatusModal(true)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-[0.98] ml-auto ${
                  isAtivo 
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-700' 
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                }`}
              >
                {isAtivo ? <Archive size={18} /> : <PlayCircle size={18} />}
                {isAtivo ? 'Desativar' : 'Ativar'}
              </button>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Laudo + Horários */}
          <div className="lg:col-span-2 space-y-6">

            {/* Ações rápidas */}
            <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-900">Registros</h3>
              </div>
              <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href={`/momentos/registrar?aluno_id=${aluno.server_id || aluno.id}`}
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
                  href={`/alunos/${aluno.server_id || aluno.id}/fotos`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-primary/40 hover:bg-slate-50 hover:shadow-sm transition-all group"
                >
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Images size={22} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-slate-900 group-hover:text-primary transition-colors">Ver Fotos</p>
                    <p className="text-xs text-slate-500 mt-0.5">Registros fotográficos do aluno</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Laudo */}
            {aluno.diagnostico && (
              <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">Laudo / Diagnóstico</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-slate-600 leading-relaxed">{aluno.diagnostico}</p>
                  <p className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg font-medium inline-flex items-center gap-1.5">
                    <span className="text-amber-500">🔒</span> Campo sensível — acesso auditado por LGPD Art. 58 LDB
                  </p>
                </div>
              </div>
            )}
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
                  { label: 'Professora de Apoio', value: apoioNome },
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

      {showStatusModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isAtivo ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {isAtivo ? <Archive size={20} /> : <PlayCircle size={20} />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {isAtivo ? 'Desativar Aluno' : 'Ativar Aluno'}
                </h3>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-slate-600">
                {isAtivo 
                  ? <>Tem certeza que deseja desativar o aluno <strong>{aluno.nome}</strong>? Ele não aparecerá mais nos horários ativos.</>
                  : <>Tem certeza que deseja ativar o aluno <strong>{aluno.nome}</strong>? Ele voltará a aparecer nos horários ativos.</>
                }
              </p>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowStatusModal(false)}
                disabled={isUpdatingStatus}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleToggleStatus}
                disabled={isUpdatingStatus}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors shadow-sm active:scale-[0.98] disabled:opacity-50 ${
                  isAtivo ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isUpdatingStatus ? <Loader2 size={16} className="animate-spin" /> : (isAtivo ? <Archive size={16} /> : <PlayCircle size={16} />)}
                {isUpdatingStatus ? 'Aguarde...' : (isAtivo ? 'Sim, desativar' : 'Sim, ativar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
