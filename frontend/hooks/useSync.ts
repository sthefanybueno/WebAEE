'use client'

import { useEffect, useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { apiClient, ApiError } from '@/lib/api/client'

type SyncState = 'idle' | 'syncing' | 'error' | 'offline'

/**
 * useSync — drena a fila de sincronização quando o dispositivo fica online.
 *
 * Fluxo:
 *   1. Detecta evento `online`
 *   2. Lê sync_queue ordenado por prioridade (1 = relatórios, 2 = alunos/fotos)
 *   3. Para cada item, chama apiClient.post/patch/delete
 *   4. Se sucesso → remove da fila e marca entidade como `synced`
 *   5. Se 401    → interrompe sync (sessão expirada; apiClient redireciona)
 *   6. Se outro erro → mantém na fila para próxima tentativa (falha transiente)
 *
 * Tratamento de erros:
 *   - `ApiError` com status 401: para o loop imediatamente.
 *   - `ApiError` com outros status: item permanece na fila.
 *   - Erros de rede inesperados: item permanece na fila.
 *
 * [Clean Architecture v3]
 *   - pendingCount agora é reativo via useLiveQuery (sem setInterval frágil).
 *   - Construção de URL permanece aqui pois é responsabilidade de adaptador HTTP.
 */
export function useSync() {
  const [state, setState] = useState<SyncState>('idle')

  // ✅ Contagem reativa: atualiza automaticamente quando sync_queue muda
  // Substitui o setInterval(3000) frágil e não-reativo
  const pendingCount = useLiveQuery(() => db.sync_queue.count(), []) ?? 0

  const runSync = useCallback(async () => {
    if (!navigator.onLine) {
      setState('offline')
      return
    }

    const items = await db.sync_queue.orderBy('prioridade').toArray()

    if (items.length === 0) {
      setState('idle')
      return
    }

    setState('syncing')

    for (const item of items) {
      try {
        const endpoint = `/api/${item.entidade}s`

        if (item.operacao === 'create') {
          await apiClient.post(endpoint, item.payload)
        } else if (item.operacao === 'update') {
          const serverId = (item.payload as { server_id?: string }).server_id
          await apiClient.put(`${endpoint}/${serverId}`, item.payload)
        } else if (item.operacao === 'delete') {
          const serverId = (item.payload as { server_id?: string }).server_id
          await apiClient.delete(`${endpoint}/${serverId}`)
        }

        // Sucesso: remove da fila e marca como sincronizado
        await db.sync_queue.delete(item.id!)

        if (
          item.entidade === 'aluno' &&
          (item.payload as { local_id?: number }).local_id
        ) {
          await db.alunos.update(
            (item.payload as { local_id: number }).local_id,
            { sync_status: 'synced' },
          )
        }
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.statusCode === 401) {
            // Sessão expirada: apiClient já redirecionou para /login
            console.error('[Sync] Sessão expirada. Sincronização interrompida.')
            setState('error')
            return // Para o loop inteiramente
          }

          // Erro de servidor (4xx/5xx): mantém na fila para próxima tentativa
          console.warn(
            `[Sync] Falha no item ${item.id} (HTTP ${err.statusCode}): ${err.detail}. Será retentado.`,
          )
        } else {
          // Erro de rede inesperado (offline, timeout, etc.)
          console.warn(
            `[Sync] Falha de rede no item ${item.id}. Será retentado.`,
            err,
          )
        }
      }
    }

    const remaining = await db.sync_queue.count()
    setState(remaining === 0 ? 'idle' : 'error')
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
