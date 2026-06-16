'use client'

/**
 * useEscolas — Application Hook
 * ==============================
 * Busca a lista de escolas disponíveis na API backend (/api/escolas/).
 * Retorna id (UUID) e nome para popular o <select> do formulário.
 *
 * [Thin Component Pattern] Nunca faça fetch direto em componentes.
 * Este hook encapsula a chamada e expõe apenas o que a UI precisa.
 */

import { useEffect, useState } from 'react'
import { apiClient } from '@/infrastructure/http/client'

export interface EscolaOption {
  id: string   // UUID do backend
  nome: string
}

export function useEscolas() {
  const [escolas, setEscolas] = useState<EscolaOption[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEscolas() {
      try {
        const data = await apiClient.get<EscolaOption[]>('/api/escolas/')
        setEscolas(data)
      } catch {
        // Fallback offline: se a API não estiver acessível, usa lista local
        console.warn('[useEscolas] Não foi possível carregar escolas da API. Usando lista de fallback.')
        setEscolas([
          { id: '00000000-0000-0000-0000-000000000001', nome: 'E.E. Castelo Branco' },
          { id: '00000000-0000-0000-0000-000000000002', nome: 'E.M. Flores do Campo' },
          { id: '00000000-0000-0000-0000-000000000003', nome: 'E.M. Primavera' },
        ])
        setError('Modo offline: exibindo escolas em cache.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEscolas()
  }, [])

  return { escolas, isLoading, error }
}
