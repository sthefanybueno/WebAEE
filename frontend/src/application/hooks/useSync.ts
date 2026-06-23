'use client'

import { useEffect, useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/infrastructure/db/db'
import { apiClient, ApiError } from '@/infrastructure/http/client'
import type { AlunoLocal } from '@/infrastructure/db/db'

type SyncState = 'idle' | 'syncing' | 'error' | 'offline'

/**
 * useSync — gerencia a sincronização bidirecional entre o Dexie e o backend.
 *
 * Fluxo Up (runSync):
 *   1. Drena sync_queue quando online.
 *   2. POST/PUT/DELETE para API e atualiza local_id para server_id.
 *
 * Fluxo Down (runSyncDown):
 *   1. Busca lista completa de Alunos do servidor.
 *   2. Faz merge com a base local (atualizando campos, mantendo o que foi editado offline se necessário).
 *
 * [Clean Architecture v3]
 *   - pendingCount agora é reativo via useLiveQuery.
 *   - Lógica de requests encapsulada aqui, separando do componente UI.
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
        const payload = { ...item.payload } as Record<string, unknown>

        // Patch automático para corrigir dados em cache na fila
        if (item.entidade === 'aluno') {
          if (payload.consentimento_lgpd === undefined) {
            payload.consentimento_lgpd = true
          }
        }

        let response: any = null
        let skipDefaultRequest = false

        // Para fotos: atualiza aluno_id se o aluno foi sincronizado recentemente
        if (item.entidade === 'foto') {
          if (payload.aluno_id && String(payload.aluno_id).length < 32) {
             const localAlunoId = Number(payload.aluno_id)
             if (!isNaN(localAlunoId)) {
               const aluno = await db.alunos.get(localAlunoId)
               if (aluno && aluno.server_id) {
                 payload.aluno_id = aluno.server_id
               }
             }
          }
          
          if (item.operacao === 'create') {
            const localFotoId = (payload as any).local_foto_id
            const foto = await db.fotos.get(localFotoId)
            
            if (foto && foto.blob) {
              const formData = new FormData()
              formData.append('file', foto.blob, 'photo.jpg')
              formData.append('aluno_id', String(payload.aluno_id))
              formData.append('tag', String(payload.tag))

              // Usa o httpClient, passando body no format options
              // Como is FormData, Content-Type não será application/json
              const res = await apiClient.post('/api/fotos/upload', formData)
              response = res
              skipDefaultRequest = true
            } else {
              console.warn(`[Sync] Foto blob not found for item ${item.id}. Ignorando da fila.`)
              await db.sync_queue.delete(item.id!)
              continue
            }
          }
        }

        if (!skipDefaultRequest) {
          if (item.operacao === 'create') {
            response = await apiClient.post(endpoint, payload)
          } else if (item.operacao === 'update') {
            const serverId = payload.server_id
            response = await apiClient.put(`${endpoint}/${serverId}`, payload)
          } else if (item.operacao === 'delete') {
            const serverId = payload.server_id
            await apiClient.delete(`${endpoint}/${serverId}`)
          }
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
        
        if (
          item.entidade === 'foto' &&
          (item.payload as any).local_foto_id
        ) {
          const localFotoId = (item.payload as any).local_foto_id
          await db.fotos.update(localFotoId, {
            sync_status: 'synced',
            server_id: response?.id,
            url_remote: response?.url
          })
        }
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.statusCode === 401) {
            // SessÃ£o expirada: apiClient jÃ¡ redirecionou para /login
            console.error('[Sync] SessÃ£o expirada. SincronizaÃ§Ã£o interrompida.')
            setState('error')
            return // Para o loop inteiramente
          }
          if (err.statusCode === 404) {
            // O item nÃ£o existe no servidor (ex: foi deletado por outro meio).
            // Para evitar loop infinito, removemos da fila.
            console.warn(`[Sync] Servidor retornou 404 para o item ${item.id} (${item.entidade}). Removendo da fila de sync para evitar loop infinito.`)
            await db.sync_queue.delete(item.id!)
            continue
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

  // Função para baixar os dados do servidor para o Dexie
  const runSyncDown = useCallback(async () => {
    if (!navigator.onLine) return

    try {
      // 1. Buscar Alunos da API
      const alunosServer = await apiClient.get<any[]>('/api/alunos')
      
      // 2. Para cada aluno, salvar/atualizar no Dexie.
      // O campo sync_status será marcado como 'synced' pois veio do servidor.
      const alunosToPut = alunosServer.map(a => {
        const { id, ...rest } = a
        return {
          ...rest,
          server_id: id,
          sync_status: 'synced',
          conflict_flag: false,
        }
      })

      for (const aluno of alunosToPut) {
        const existente = await db.alunos.where('server_id').equals(aluno.server_id).first()
        if (existente) {
          // Mantém o ID local e atualiza os dados A MENOS QUE haja edições locais pendentes
          if (existente.sync_status !== 'local') {
            await db.alunos.update(existente.id!, aluno)
          }
        } else {
          // Insere novo
          await db.alunos.add(aluno)
        }
      }
      
      console.log(`[SyncDown] ${alunosToPut.length} alunos sincronizados com o servidor.`)
    } catch (err) {
      console.error('[SyncDown] Erro ao buscar alunos do servidor:', err)
    }
  }, [])

  // Dispara sync automaticamente quando ficar online
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    const handleOnline = () => {
      runSyncDown()
      runSync()
    }
    window.addEventListener('online', handleOnline)
    
    // Tenta sync imediato ao montar (caso já esteja online com pendências)
    if (navigator.onLine) {
      timeoutId = setTimeout(() => {
        runSyncDown()
        runSync()
      }, 0)
    }
    
    return () => {
      window.removeEventListener('online', handleOnline)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [runSync, runSyncDown])

  return { state, pendingCount, runSync, runSyncDown }
}

