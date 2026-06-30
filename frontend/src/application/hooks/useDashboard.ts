'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/infrastructure/http/client'

export interface ActivityItem {
  id: string
  type: string
  description: string
  created_at: string
}

export interface DashboardResponse {
  total_alunos_ativos: number
  total_relatorios_pendentes: number
  total_fotos_hoje: number
  recent_activities: ActivityItem[]
}

// Cache em memória para exibir o último dado válido enquanto offline.
// Não é persistido no IndexedDB pois são contagens calculadas pelo servidor.
let lastValidStats: DashboardResponse | null = null

export function useDashboard() {
  const [stats, setStats] = useState<DashboardResponse | null>(lastValidStats)
  const [isLoading, setIsLoading] = useState(lastValidStats === null)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    async function fetchDashboard() {
      // Sem internet: exibe o último dado válido sem tentar a API
      if (!navigator.onLine) {
        setIsOffline(true)
        setIsLoading(false)
        return
      }

      setIsOffline(false)
      setIsLoading(true)
      try {
        const data = await apiClient.get<DashboardResponse>('/api/dashboard/')
        lastValidStats = data   // persiste para próximo mount offline
        setStats(data)
      } catch (err) {
        // Rede caiu durante o fetch: mantém o que tinha, não zera
        console.warn('[useDashboard] Erro ao carregar dados do dashboard', err)
        if (lastValidStats) setStats(lastValidStats)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboard()

    // Re-busca quando a conexão voltar
    const handleOnline = () => {
      setIsOffline(false)
      fetchDashboard()
    }
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { stats, isLoading, isOffline }
}
