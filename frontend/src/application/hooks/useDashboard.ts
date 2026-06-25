'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/infrastructure/http/client'

export interface DashboardResponse {
  total_alunos_ativos: number
  total_relatorios_pendentes: number
  total_fotos_hoje: number
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const data = await apiClient.get<DashboardResponse>('/api/dashboard/')
        setStats(data)
      } catch (err) {
        console.warn('[useDashboard] Erro ao carregar os dados do dashboard', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  return { stats, isLoading }
}
