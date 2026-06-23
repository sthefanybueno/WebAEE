'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '@/infrastructure/http/client'
import type { Notificacao } from '@/domain/entities/Notificacao'
import { usePapel } from './usePapel'
import { PapelUsuario } from '@/domain/entities/Usuario'

const PAPEIS_COM_NOTIFICACAO = [
  PapelUsuario.ADMIN,
  PapelUsuario.COORDENACAO,
  PapelUsuario.PROF_AEE,
]

export function useNotificacoes() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [loading, setLoading] = useState(false)
  const dadosUsuario = usePapel()

  const podeVerNotificacoes = dadosUsuario
    ? PAPEIS_COM_NOTIFICACAO.includes(dadosUsuario.papel)
    : false

  const naoLidas = notificacoes.filter((n) => !n.lida).length

  const buscar = useCallback(async () => {
    if (!podeVerNotificacoes || !navigator.onLine) return

    setLoading(true)
    try {
      const raw = await apiClient.get<Record<string, unknown>[]>('/api/notificacoes/')
      // Mapeia snake_case → camelCase
      const mapped: Notificacao[] = raw.map((r) => ({
        id: r.id as string,
        tenantId: r.tenant_id as string,
        autorId: r.autor_id as string,
        tipo: r.tipo as string,
        mensagem: r.mensagem as string,
        relatorioId: r.relatorio_id as string | undefined,
        alunoId: r.aluno_id as string | undefined,
        lida: r.lida as boolean,
        createdAt: r.created_at as string,
      }))
      setNotificacoes(mapped)
    } catch {
      // Silencia erros de rede — notificações são não-críticas
    } finally {
      setLoading(false)
    }
  }, [podeVerNotificacoes])

  const marcarComoLida = useCallback(async (id: string) => {
    try {
      await apiClient.patch(`/api/notificacoes/${id}/lida`, {})
      setNotificacoes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
      )
    } catch {
      // Silencia — não crítico
    }
  }, [])

  const marcarTodasComoLidas = useCallback(async () => {
    const naoLidasList = notificacoes.filter((n) => !n.lida)
    await Promise.all(naoLidasList.map((n) => marcarComoLida(n.id)))
  }, [notificacoes, marcarComoLida])

  useEffect(() => {
    buscar()
  }, [buscar])

  return { notificacoes, naoLidas, loading, buscar, marcarComoLida, marcarTodasComoLidas }
}
