'use client'

import { AppShell } from '@/presentation/components/layout/AppShell'
import { ArrowLeft, Images, X, AlertCircle, Download, FileArchive, FileText } from 'lucide-react'
import JSZip from 'jszip'
import { jsPDF } from 'jspdf'
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
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [showDownloadAllModal, setShowDownloadAllModal] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleDelete = async (fotoId: string) => {
    setIsDeleting(true)
    try {
      await apiClient.delete(`/api/fotos/${fotoId}`)
      setFotos(f => f.filter(x => x.id !== fotoId))
      setSelecionada(null)
      showToast('Foto excluída com sucesso!', 'success')
    } catch (err) {
      showToast('Erro ao excluir foto.', 'error')
    } finally {
      setIsDeleting(false)
      setConfirmDelete(null)
    }
  }

  const handleDownloadSingle = async (foto: Foto) => {
    try {
      showToast('Iniciando download...', 'success')
      const response = await fetch(foto.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `foto_${foto.id.split('-')[0]}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch (e) {
      showToast('Erro ao baixar foto.', 'error')
    }
  }

  const handleDownloadAllZip = async () => {
    if (fotos.length === 0) return
    setIsDownloading(true)
    setShowDownloadAllModal(false)
    showToast('Preparando arquivo ZIP...', 'success')
    try {
      const zip = new JSZip()
      for (let i = 0; i < fotos.length; i++) {
        const response = await fetch(fotos[i].url)
        const blob = await response.blob()
        zip.file(`foto_${i + 1}.jpg`, blob)
      }
      const content = await zip.generateAsync({ type: 'blob' })
      const url = window.URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `fotos_${aluno?.nome || 'aluno'}.zip`
      a.click()
      window.URL.revokeObjectURL(url)
      showToast('Download concluído!', 'success')
    } catch (e) {
      showToast('Erro ao gerar ZIP.', 'error')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadAllPdf = async () => {
    if (fotos.length === 0) return
    setIsDownloading(true)
    setShowDownloadAllModal(false)
    showToast('Gerando documento PDF...', 'success')
    try {
      const doc = new jsPDF()
      for (let i = 0; i < fotos.length; i++) {
        if (i > 0) doc.addPage()
        const response = await fetch(fotos[i].url)
        const blob = await response.blob()
        const reader = new FileReader()
        const base64data = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })
        
        doc.setFontSize(14)
        doc.text(fotos[i].descricao || 'Registro fotográfico', 10, 20)
        doc.setFontSize(10)
        const dateStr = fotos[i].created_at.endsWith('Z') ? fotos[i].created_at : `${fotos[i].created_at}Z`
        doc.text(new Date(dateStr).toLocaleString('pt-BR'), 10, 28)
        
        doc.addImage(base64data, 'JPEG', 10, 35, 190, 200, undefined, 'FAST')
      }
      doc.save(`relatorio_fotos_${aluno?.nome || 'aluno'}.pdf`)
      showToast('Download concluído!', 'success')
    } catch (e) {
      showToast('Erro ao gerar PDF.', 'error')
    } finally {
      setIsDownloading(false)
    }
  }

  useEffect(() => {
    if (!id) return
    setLoadingFotos(true)
    apiClient
      .get<Foto[]>(`/api/fotos/aluno/${id}`)
      .then(res => {
        const sorted = res.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setFotos(sorted)
      })
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
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
          
          {fotos.length > 0 && (
            <button
              onClick={() => setShowDownloadAllModal(true)}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50"
            >
              <Download size={16} />
              {isDownloading ? 'Baixando...' : 'Baixar Tudo'}
            </button>
          )}
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
                    {new Date(foto.created_at.endsWith('Z') ? foto.created_at : `${foto.created_at}Z`).toLocaleString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    }).replace(',', '')}
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
                  {new Date(selecionada.created_at.endsWith('Z') ? selecionada.created_at : `${selecionada.created_at}Z`).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-4 py-2 text-sm text-primary bg-primary-light/10 hover:bg-primary-light/20 rounded-lg transition-colors font-medium flex items-center gap-2"
                  onClick={() => handleDownloadSingle(selecionada)}
                >
                  <Download size={16} />
                  Baixar
                </button>
                <button
                  className="px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium flex items-center gap-2"
                  onClick={() => setConfirmDelete(selecionada.id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Excluindo...' : 'Excluir'}
                </button>
                <button
                  className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  onClick={() => setSelecionada(null)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal de Confirmação de Exclusão */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Excluir foto?</h3>
              <p className="text-sm text-slate-500">
                Tem certeza que deseja excluir esta foto? Esta ação não pode ser desfeita e a foto será apagada definitivamente.
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting ? 'Excluindo...' : 'Sim, excluir foto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Download de Todas as Fotos */}
      {showDownloadAllModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 pb-2">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Baixar Todas as Fotos</h3>
              <p className="text-sm text-slate-500 mb-6">
                Como você deseja exportar os registros fotográficos?
              </p>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={handleDownloadAllPdf}
                  className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-primary hover:bg-primary-light/5 transition-all text-slate-700 hover:text-primary"
                >
                  <FileText size={32} className="mb-2 text-primary/80" />
                  <span className="font-semibold text-sm">Relatório em PDF</span>
                  <span className="text-[10px] text-slate-400 mt-1 text-center">Fotos e descrições formatadas</span>
                </button>
                <button
                  onClick={handleDownloadAllZip}
                  className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:border-primary hover:bg-primary-light/5 transition-all text-slate-700 hover:text-primary"
                >
                  <FileArchive size={32} className="mb-2 text-primary/80" />
                  <span className="font-semibold text-sm">Pasta ZIP</span>
                  <span className="text-[10px] text-slate-400 mt-1 text-center">Apenas as imagens</span>
                </button>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowDownloadAllModal(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[120] animate-in slide-in-from-bottom-5">
          <div className={`rounded-xl shadow-lg border p-4 flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex-1">
              <p className="text-sm font-semibold">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="p-1 hover:bg-black/5 rounded-md transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}
