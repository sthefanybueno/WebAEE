'use client'

import { useEffect, useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/infrastructure/db/db'
import { apiClient, ApiError } from '@/infrastructure/http/client'

type SyncState = 'idle' | 'syncing' | 'error' | 'offline'

/**
 * useSync â€” drena a fila de sincronizaÃ§Ã£o quando o dispositivo fica online.
 *
 * Fluxo:
 *   1. Detecta evento `online`
 *   2. LÃª sync_queue ordenado por prioridade (1 = relatÃ³rios, 2 = alunos/fotos)
 *   3. Para cada item, chama apiClient.post/patch/delete
 *   4. Se sucesso â†’ remove da fila e marca entidade como `synced`
 *   5. Se 401    â†’ interrompe sync (sessÃ£o expirada; apiClient redireciona)
 *   6. Se outro erro â†’ mantÃ©m na fila para prÃ³xima tentativa (falha transiente)
 *
 * Tratamento de erros:
 *   - `ApiError` com status 401: para o loop imediatamente.
 *   - `ApiError` com outros status: item permanece na fila.
 *   - Erros de rede inesperados: item permanece na fila.
 *
 * [Clean Architecture v3]
 *   - pendingCount agora Ã© reativo via useLiveQuery (sem setInterval frÃ¡gil).
 *   - ConstruÃ§Ã£o de URL permanece aqui pois Ã© responsabilidade de adaptador HTTP.
 */
export function useSync() {
  const [state, setState] = useState<SyncState>('idle')

  // âœ… Contagem reativa: atualiza automaticamente quando sync_queue muda
  // Substitui o setInterval(3000) frÃ¡gil e nÃ£o-reativo
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
        let payload = { ...item.payload } as Record<string, unknown>

        // Patch automático para corrigir dados em cache na fila
        if (item.entidade === 'aluno') {
          const nomeEscola = payload.escola_atual || payload.escola
          if (!payload.escola_atual_id && nomeEscola) {
            const mapEscolaReverse: Record<string, string> = {
              'E.E. Castelo Branco': '00000000-0000-0000-0000-000000000001',
              'E.M. Flores do Campo': '00000000-0000-0000-0000-000000000002',
              'E.M. Primavera': '00000000-0000-0000-0000-000000000003'
            }
            payload.escola_atual_id = mapEscolaReverse[nomeEscola as string] || '00000000-0000-0000-0000-000000000001'
          }
          if (payload.consentimento_lgpd === undefined) {
            payload.consentimento_lgpd = true
          }
        }

        // Patch automático para fotos (relacionamentos e upload)
        if (item.entidade === 'foto') {
          // Tenta atualizar o aluno_id caso o aluno tenha acabado de ser sincronizado
          if (payload.aluno_id && String(payload.aluno_id).length < 32) {
             const localAlunoId = Number(payload.aluno_id)
             if (!isNaN(localAlunoId)) {
               const aluno = await db.alunos.get(localAlunoId)
               if (aluno && aluno.server_id) {
                 payload.aluno_id = aluno.server_id
               }
             }
          }
          if (!payload.url) {
            // TODO: Fazer upload real do blob da foto. Placeholder por enquanto.
            payload.url = "https://placeholder.com/offline-sync.jpg"
          }
        }

        let response: any = null

        if (item.operacao === 'create') {
          response = await apiClient.post(endpoint, payload)
        } else if (item.operacao === 'update') {
          const serverId = payload.server_id
          response = await apiClient.put(`${endpoint}/${serverId}`, payload)
        } else if (item.operacao === 'delete') {
          const serverId = payload.server_id
          await apiClient.delete(`${endpoint}/${serverId}`)
        }

        // Sucesso: remove da fila e marca como sincronizado
        await db.sync_queue.delete(item.id!)

        if (
          item.entidade === 'aluno' &&
          (item.payload as { local_id?: number }).local_id
        ) {
          const localId = (item.payload as { local_id: number }).local_id
          const updateData: any = { sync_status: 'synced' }
          if (response && response.id) {
            updateData.server_id = response.id
          }
          await db.alunos.update(localId, updateData)
        }
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.statusCode === 401) {
            // SessÃ£o expirada: apiClient jÃ¡ redirecionou para /login
            console.error('[Sync] SessÃ£o expirada. SincronizaÃ§Ã£o interrompida.')
            setState('error')
            return // Para o loop inteiramente
          }

          // Erro de servidor (4xx/5xx): mantÃ©m na fila para prÃ³xima tentativa
          const detailStr = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail)
          console.warn(
            `[Sync] Falha no item ${item.id} (HTTP ${err.statusCode}): ${detailStr}. SerÃ¡ retentado.`,
          )
        } else {
          // Erro de rede inesperado (offline, timeout, etc.)
          console.warn(
            `[Sync] Falha de rede no item ${item.id}. SerÃ¡ retentado.`,
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
    // Tenta sync imediato ao montar (caso jÃ¡ esteja online com pendÃªncias)
    if (navigator.onLine) runSync()
    return () => window.removeEventListener('online', runSync)
  }, [runSync])

  return { state, pendingCount, runSync }
}

