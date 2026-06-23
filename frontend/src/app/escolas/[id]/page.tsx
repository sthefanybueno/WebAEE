'use client'

import { AppShell } from '@/presentation/components/layout/AppShell'
import { ArrowLeft, School, Users } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiClient } from '@/infrastructure/http/client'
import { getInitials } from '@/presentation/utils/utils'

interface EscolaDetalhe {
  id: string
  nome: string
  ativo: boolean
}

interface AlunoItem {
  id: string
  nome: string
  status: string
  data_nascimento?: string
}

export default function EscolaDetalhePage() {
  const params = useParams()
  const id = params.id as string
  const [escola, setEscola] = useState<EscolaDetalhe | null>(null)
  const [alunos, setAlunos] = useState<AlunoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      apiClient.get<EscolaDetalhe>(`/api/escolas/${id}`).catch(() => null),
      apiClient.get<AlunoItem[]>(`/api/alunos/?escola_id=${id}`).catch(() => []),
    ]).then(([escolaData, alunosData]) => {
      if (escolaData) setEscola(escolaData)
      setAlunos(alunosData || [])
    }).finally(() => setLoading(false))
  }, [id])

  return (
    <AppShell title={escola?.nome ?? 'Escola'}>
      <div className="max-w-[1160px] mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/escolas"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={15} />
            Voltar para escolas
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
            <School size={22} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {loading ? 'Carregando...' : (escola?.nome ?? 'Escola')}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading ? '...' : `${alunos.length} ${alunos.length === 1 ? 'aluno' : 'alunos'}`}
            </p>
          </div>
        </div>

        {/* Lista de alunos */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
            <Users size={16} className="text-gray-400" />
            <h3 className="font-bold text-gray-900">Alunos desta escola</h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <span className="text-sm text-gray-400">Carregando...</span>
            </div>
          ) : alunos.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 h-48">
              <Users size={32} className="text-gray-200" />
              <p className="text-sm text-gray-400 font-medium">Nenhum aluno cadastrado nesta escola</p>
              <Link
                href="/alunos/novo"
                className="mt-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Cadastrar aluno
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {alunos.map((aluno) => (
                <Link
                  key={aluno.id}
                  href={`/alunos/${aluno.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                    {getInitials(aluno.nome)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{aluno.nome}</p>
                    {aluno.data_nascimento && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(aluno.data_nascimento).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                      aluno.status === 'ativo'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {aluno.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
