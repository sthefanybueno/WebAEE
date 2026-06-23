'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/infrastructure/http/client'
import { useEscolas } from '@/application/hooks/useEscolas'
import { ReportTemplate } from '@/application/hooks/useReportTemplates'

export function useDynamicRelatorioForm(template_id: string) {
  const router = useRouter()
  const [template, setTemplate] = useState<ReportTemplate | null>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [erroGlobal, setErroGlobal] = useState<string | null>(null)
  const [templateLoading, setTemplateLoading] = useState(true)

  // O ideal era useAlunos, mas useEscolas existe como exemplo, vamos simular busca de alunos
  // ou buscar os alunos do backend real.
  const [alunos, setAlunos] = useState<any[]>([])
  const [alunosLoading, setAlunosLoading] = useState(true)

  const [formData, setFormData] = useState<Record<string, any>>({
    aluno_id: '',
    data: new Date().toISOString().split('T')[0],
    conteudo: {}
  })

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [tempData, alData] = await Promise.all([
          apiClient.get<ReportTemplate>(`/api/relatorios/templates/${template_id}`),
          apiClient.get<any[]>('/api/alunos') // Assumindo rota de alunos
        ])
        setTemplate(tempData)
        setAlunos(alData)
        
        // Inicializar conteudo vazio baseado nos campos
        const initialConteudo: Record<string, string> = {}
        if (tempData.secoes?.campos) {
          tempData.secoes.campos.forEach((campo: any) => {
            initialConteudo[campo.id] = ''
          })
        }
        setFormData(prev => ({ ...prev, conteudo: initialConteudo }))
      } catch (e) {
        console.error(e)
        setErroGlobal('Erro ao carregar os dados.')
      } finally {
        setTemplateLoading(false)
        setAlunosLoading(false)
      }
    }
    fetchInitialData()
  }, [template_id])

  const handleConteudoChange = (campoId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      conteudo: {
        ...prev.conteudo,
        [campoId]: value
      }
    }))
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroGlobal(null)
    
    if (!formData.aluno_id) {
      setErroGlobal('Selecione um aluno.')
      return
    }

    setIsSubmitting(true)

    try {
      const payload = {
        template_id: template_id,
        aluno_id: formData.aluno_id,
        // Converte os IDs dos campos para algo que faça sentido no BD, ou salva o dict completo.
        // O BD espera dict em conteudo_json
        conteudo_json: {
          data: formData.data,
          ...formData.conteudo
        }
      }
      
      await apiClient.post('/api/relatorios/', payload)
      router.push(`/relatorios/${template_id}`)
      router.refresh()
    } catch (error: any) {
      setErroGlobal(error.detail || 'Ocorreu um erro ao salvar o relatório.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    template,
    templateLoading,
    alunos,
    alunosLoading,
    formData,
    handleChange,
    handleConteudoChange,
    isSubmitting,
    erroGlobal,
    onSubmit
  }
}
