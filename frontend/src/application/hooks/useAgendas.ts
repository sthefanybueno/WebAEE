'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/infrastructure/http/client'

export interface ScheduleResponse {
  id: string
  aluno_id: string
  dia_semana: string
  hora: string
  atividade: string
  tipo_slot: string
}

export function useAgendas() {
  const [agendas, setAgendas] = useState<ScheduleResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchAgendas() {
      try {
        const data = await apiClient.get<ScheduleResponse[]>('/api/agendas/')
        setAgendas(data)
      } catch (err) {
        console.warn('[useAgendas] Erro ao carregar as agendas', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAgendas()
  }, [])

  return { agendas, isLoading }
}
