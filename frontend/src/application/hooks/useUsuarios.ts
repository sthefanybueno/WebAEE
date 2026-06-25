'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/infrastructure/http/client'

export interface UsuarioResponse {
  id: string
  nome: string
  email: string
  papel: string
  ativo: boolean
}

export interface PaginatedUsuarios {
  items: UsuarioResponse[]
  total: number
  page: number
  size: number
}

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState<UsuarioResponse[]>([])
  const [total, setTotal] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUsuarios() {
      try {
        const data = await apiClient.get<PaginatedUsuarios>('/api/usuarios/')
        setUsuarios(data.items)
        setTotal(data.total)
      } catch (err) {
        console.warn('[useUsuarios] Não foi possível carregar os usuários.', err)
        setError('Não foi possível carregar os usuários.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsuarios()
  }, [])

  return { usuarios, total, isLoading, error }
}
