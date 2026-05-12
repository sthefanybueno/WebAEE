'use client'

import { useEffect, useState, useCallback } from 'react'
import { db } from '@/lib/db'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

type SyncState = 'idle' | 'syncing' | 'error' | 'offline'

/**
 * useSync — drena a fila de sincronização quando o dispositivo fica online.
 *
 * Fluxo:
 *   1. Detecta evento `online`
 *   2. Lê sync_queue ordenado por prioridade (1 = relatórios, 2 = fotos)
 *   3. Para cada item, faz POST/PATCH/DELETE na API
 *   4. Se sucesso → remove da fila e marca entidade como `synced`
 *   5. Se falha → mantém na fila para próxima tentativa
 */
export function useSync() {
  const [state, setState] = useState<SyncState>('idle')
  const [pendingCount, setPendingCount] = useState(0)

  // Atualiza count de pendentes reativamente
  useEffect(() => {
    const interval = setInterval(async () => {
      const count = await db.sync_queue.count()
      setPendingCount(count)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const runSync = useCallback(async () => {
    if (!navigator.onLine) { setState('offline'); return }

    const items = await db.sync_queue
      .orderBy('prioridade')
      .toArray()

    if (items.length === 0) { setState('idle'); return }

    setState('syncing')

    for (const item of items) {
      try {
        const token = typeof window !== 'undefined'
          ? localStorage.getItem('aee_token')
          : null

        const method = item.operacao === 'create' ? 'POST'
          : item.operacao === 'update' ? 'PATCH' : 'DELETE'

        const endpoint = `${API_BASE}/api/${item.entidade}s`

        const res = await fetch(
          item.operacao === 'delete'
            ? `${endpoint}/${(item.payload as { server_id?: string }).server_id}`
            : endpoint,
          {
            method,
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: method !== 'DELETE' ? JSON.stringify(item.payload) : undefined,
          }
        )

        if (res.ok) {
          // Remove da fila
          await db.sync_queue.delete(item.id!)

          // Marca entidade local como synced
          if (item.entidade === 'aluno' && (item.payload as { local_id?: number }).local_id) {
            await db.alunos.update((item.payload as { local_id: number }).local_id, {
              sync_status: 'synced',
            })
          }
        }
      } catch {
        // Mantém na fila — será tentado na próxima vez
      }
    }

    const remaining = await db.sync_queue.count()
    setState(remaining === 0 ? 'idle' : 'error')
    setPendingCount(remaining)
  }, [])

  // Dispara sync automaticamente quando ficar online
  useEffect(() => {
    window.addEventListener('online', runSync)
    // Tenta sync imediato ao montar (caso já esteja online com pendências)
    if (navigator.onLine) runSync()
    return () => window.removeEventListener('online', runSync)
  }, [runSync])

  return { state, pendingCount, runSync }
}
