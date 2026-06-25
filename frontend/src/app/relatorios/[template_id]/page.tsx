'use client'

import { useEffect, useState } from 'react'
import { AppShell } from '@/presentation/components/layout/AppShell'
import Link from 'next/link'
import { ArrowLeft, Plus, FileText, Calendar, User } from 'lucide-react'
import { apiClient } from '@/infrastructure/http/client'
import { ReportTemplate } from '@/application/hooks/useReportTemplates'
import { useParams } from 'next/navigation'
import { usePapel } from '@/application/hooks/usePapel'
import { ReportModal } from './ReportModal'

interface Report {
  id: string
  template_id: string
  aluno_id: string
  autor_id: string
  conteudo_json: any
  created_at: string
}

export default function ListaRelatoriosPorTemplatePage() {
  const params = useParams()
  const template_id = params.template_id as string
  
  const [template, setTemplate] = useState<ReportTemplate | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [alunosMap, setAlunosMap] = useState<Record<string, string>>({})
  
  const dadosUsuario = usePapel()
  const canCreateReport = true // todos os papéis podem criar relatórios, mas não templates

  useEffect(() => {
    async function fetchData() {
      try {
        const [tempData, repData, alunosData] = await Promise.all([
          apiClient.get<ReportTemplate>(`/api/relatorios/templates/${template_id}`),
          apiClient.get<Report[]>(`/api/relatorios/template/${template_id}/relatorios`),
          apiClient.get<any[]>('/api/alunos')
        ])
        setTemplate(tempData)
        setReports(repData)
        
        const map: Record<string, string> = {}
        ;(alunosData || []).forEach(a => {
          map[a.id] = a.nome
        })
        setAlunosMap(map)
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [template_id])

  return (
    <AppShell title={template ? template.nome : "Carregando..."}>
      <div className="max-w-5xl mx-auto p-6 lg:p-8 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <Link 
              href="/relatorios" 
              className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0 mt-1 sm:mt-0"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                {isLoading ? "Carregando..." : template?.nome}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {isLoading ? "..." : template?.descricao}
              </p>
            </div>
          </div>
          
          {canCreateReport && (
            <Link 
              href={`/relatorios/${template_id}/novo`} 
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-[0.98]"
            >
              <Plus size={18} />
              Criar Documento
            </Link>
          )}
        </div>

        {/* Lista de relatórios */}
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-slate-500 mb-4">Nenhum relatório deste tipo encontrado.</p>
            {canCreateReport && (
              <Link href={`/relatorios/${template_id}/novo`} className="text-primary font-semibold hover:underline">
                Criar o primeiro
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map(report => {
              const alunoNome = alunosMap[report.aluno_id] || 'Aluno não encontrado'
              return (
              <div 
                key={report.id} 
                onClick={() => setSelectedReport(report)}
                className="bg-white border border-slate-200 rounded-xl p-5 hover:border-primary/50 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">
                      {alunoNome}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {new Date(report.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* Renderização do Modal */}
      <ReportModal 
        report={selectedReport}
        template={template}
        alunoNome={selectedReport ? (alunosMap[selectedReport.aluno_id] || 'Aluno não encontrado') : ''}
        onClose={() => setSelectedReport(null)}
      />
    </AppShell>
  )
}
