'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/infrastructure/http/client'

export interface ReportTemplate {
  id: string
  nome: string
  descricao: string
  secoes: Record<string, any>
  versao: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export function useReportTemplates() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const data = await apiClient.get<ReportTemplate[]>('/api/relatorios/templates')
        setTemplates(data)
      } catch (e: any) {
        console.warn('[useReportTemplates] Erro ao buscar templates', e)
        setError(e.detail || 'Não foi possível carregar os templates.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  return { templates, isLoading, error }
}
