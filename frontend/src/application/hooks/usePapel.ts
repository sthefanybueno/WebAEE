/**
 * Sistema AEE — Hook: usePapel
 * ==============================
 * Decodifica o JWT do localStorage e retorna os dados do usuário logado.
 * Tipado e memoizado — evita redecoding a cada render.
 *
 * [Clean Architecture] Encapsula toda lógica de decodificação JWT fora dos componentes.
 */
'use client'

import { useState, useEffect } from 'react'
import { PapelUsuario } from '@/domain/entities/Usuario'

interface DadosUsuario {
  userId: string
  tenantId: string
  papel: PapelUsuario
  nome: string
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1]
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function usePapel(): DadosUsuario | null {
  const [papelState, setPapelState] = useState<DadosUsuario | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const token = localStorage.getItem('aee_token')
    if (!token) return

    const payload = decodeJwtPayload(token)
    if (!payload) return

    const papel = payload['papel'] as string
    const userId = payload['sub'] as string
    const tenantId = payload['tenant_id'] as string
    const nome = payload['nome'] as string

    if (!papel || !userId || !tenantId) return

    // Verifica se o papel é válido
    const papeisValidos = Object.values(PapelUsuario) as string[]
    if (!papeisValidos.includes(papel)) return

    setPapelState({
      userId,
      tenantId,
      papel: papel as PapelUsuario,
      nome: nome || 'Usuário',
    })
  }, [])

  return papelState
}
