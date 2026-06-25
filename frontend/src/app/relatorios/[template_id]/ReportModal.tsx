import { ReportTemplate } from '@/application/hooks/useReportTemplates'
import { X, Download } from 'lucide-react'
import jsPDF from 'jspdf'

interface Report {
  id: string
  template_id: string
  aluno_id: string
  autor_id: string
  conteudo_json: any
  created_at: string
}

interface ReportModalProps {
  report: Report | null
  template: ReportTemplate | null
  alunoNome: string
  onClose: () => void
}

export function ReportModal({ report, template, alunoNome, onClose }: ReportModalProps) {
  if (!report || !template) return null

  const handleDownloadPDF = () => {
    const doc = new jsPDF()
    let y = 20

    // Título
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(template.nome, 20, y)
    y += 10

    // Informações básicas
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text(`Aluno: ${alunoNome}`, 20, y)
    y += 7
    doc.text(`Data: ${new Date(report.created_at).toLocaleDateString('pt-BR')}`, 20, y)
    y += 10

    // Campos dinâmicos
    const campos = template.secoes?.campos || []
    campos.forEach((campo: any) => {
      // Se houver pouco espaço na página, adiciona uma nova
      if (y > 270) {
        doc.addPage()
        y = 20
      }

      doc.setFont('helvetica', 'bold')
      doc.text(`${campo.label}:`, 20, y)
      y += 7

      doc.setFont('helvetica', 'normal')
      const valor = report.conteudo_json[campo.id] || 'Nenhum valor informado'
      
      // Quebra de texto longa (ex: textarea)
      const textLines = doc.splitTextToSize(String(valor), 170)
      doc.text(textLines, 20, y)
      
      y += (textLines.length * 7) + 5
    })

    doc.save(`${template.nome}_${alunoNome}.pdf`)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header do Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{template.nome}</h3>
            <p className="text-sm text-slate-500">Aluno: {alunoNome}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary bg-primary-light/30 hover:bg-primary-light/50 rounded-xl transition-colors"
            >
              <Download size={16} />
              Baixar PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Conteúdo do Relatório */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6 border-b border-slate-100">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Data de Criação</p>
              <p className="text-sm font-medium text-slate-900">
                {new Date(report.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
            {/* Se houver outros campos padronizados, como Data informada no form, podemos mostrar aqui */}
            {report.conteudo_json['data'] && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Data do Relatório</p>
                <p className="text-sm font-medium text-slate-900">
                  {new Date(report.conteudo_json['data']).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {template.secoes?.campos?.map((campo: any) => (
              <div key={campo.id}>
                <p className="text-sm font-semibold text-slate-900 mb-2">{campo.label}</p>
                <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-700 whitespace-pre-wrap">
                  {report.conteudo_json[campo.id] || <span className="text-slate-400 italic">Não informado</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
