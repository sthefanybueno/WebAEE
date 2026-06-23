'use client'

import { AppShell } from '@/presentation/components/layout/AppShell'
import { ArrowLeft, Images } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAluno } from '@/application/hooks/useAlunos'
import { useEffect, useState } from 'react'
import { apiClient } from '@/infrastructure/http/client'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'


interface Foto {
  id: string
  url: string
  descricao?: string
  created_at: string
  criado_por?: string
}

export default function FotosAlunoPage() {
  const params = useParams()
  const id = params.id as string
  const { aluno, loading } = useAluno(id)
  const [fotos, setFotos] = useState<Foto[]>([])
  const [loadingFotos, setLoadingFotos] = useState(true)
  const [selecionada, setSelecionada] = useState<Foto | null>(null)

  useEffect(() => {
    if (!id) return
    setLoadingFotos(true)
    apiClient
      .get<Foto[]>(`/api/fotos/aluno/${id}`)
      .then(setFotos)
      .catch(() => setFotos([]))
      .finally(() => setLoadingFotos(false))
  }, [id])

  return (
    <AppShell title="Fotos do Aluno">
      <div className="max-w-[1160px] mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            href={`/alunos/${id}`}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={15} />
            Voltar para perfil
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
            <Images size={20} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
              {loading ? 'Carregando...' : `Fotos de ${aluno?.nome ?? ''}`}
            </h2>
            <p className="text-sm text-gray-500">
              {loadingFotos ? '...' : `${fotos.length} ${fotos.length === 1 ? 'registro' : 'registros'} encontrado${fotos.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Grid de fotos */}
        {loadingFotos ? (
          <div className="flex items-center justify-center h-48">
            <span className="text-sm text-gray-400">Carregando fotos...</span>
          </div>
        ) : fotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 h-64 bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
            <Images size={36} className="text-gray-300" />
            <p className="text-sm text-gray-400 font-medium">Nenhuma foto registrada ainda</p>
            <Link
              href={`/momentos/registrar?aluno_id=${id}`}
              className="mt-1 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Registrar primeiro momento
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {fotos.map((foto) => (
              <button
                key={foto.id}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all"
                onClick={() => setSelecionada(foto)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={foto.url.startsWith('/') ? `${API_BASE}${foto.url}` : foto.url}
                  alt={foto.descricao || 'Registro fotográfico'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
                  <p className="text-white text-xs font-medium">
                    {new Date(foto.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                    })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal de visualização */}
      {selecionada && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
          onClick={() => setSelecionada(null)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selecionada.url.startsWith('/') ? `${API_BASE}${selecionada.url}` : selecionada.url}
              alt={selecionada.descricao || 'Registro fotográfico'}
              className="w-full max-h-[70vh] object-contain bg-gray-900"
            />
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{selecionada.descricao || 'Registro fotográfico'}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(selecionada.created_at).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
              <button
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                onClick={() => setSelecionada(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
