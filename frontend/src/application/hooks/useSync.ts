'use client'

import { useEffect, useState, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/infrastructure/db/db'
import { apiClient, ApiError } from '@/infrastructure/http/client'
import type { AlunoLocal } from '@/infrastructure/db/db'

type SyncState = 'idle' | 'syncing' | 'error' | 'offline'

let isSyncing = false
let isSyncingDown = false

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
      // Heal orphaned local records: If queue is empty, any record still 'local' or 'failed' must be added back to the queue
      const orphanedAlunos = await db.alunos.filter(a => a.sync_status === 'local' || a.sync_status === 'failed').toArray()
      for (const a of orphanedAlunos) {
        if (!a.server_id) {
          await db.sync_queue.add({
            entidade: 'aluno',
            operacao: 'create',
            payload: { ...a, local_id: a.id },
            prioridade: 2,
            criado_em: new Date().toISOString(),
          })
        } else {
          await db.sync_queue.add({
            entidade: 'aluno',
            operacao: 'update',
            payload: { ...a, local_id: a.id, server_id: a.server_id },
            prioridade: 2,
            criado_em: new Date().toISOString(),
          })
        }
      }
      
      // Se reinserimos algo na fila, continua a sincronização, senão idle
      const itemsAfterHeal = await db.sync_queue.orderBy('prioridade').toArray()
      if (itemsAfterHeal.length === 0) {
        setState('idle')
        return
      }
      // Se chegamos aqui, a fila agora tem itens para processar! Atualiza items
      items.push(...itemsAfterHeal)
    }

    if (isSyncing) return
    isSyncing = true
    setState('syncing')

    try {
      for (const item of items) {
      try {
        const endpoint = `/api/${item.entidade}s`
        let payload = { ...item.payload } as any

        // Mapear aluno_id local para server_id (UUID)
        if (payload.aluno_id && String(payload.aluno_id).length < 32) {
          const localAlunoId = Number(payload.aluno_id)
          if (!isNaN(localAlunoId)) {
            const aluno = await db.alunos.get(localAlunoId)
            if (aluno && aluno.server_id) {
              payload.aluno_id = aluno.server_id
            } else {
              console.warn(`[Sync] Aluno ${localAlunoId} ainda não foi sincronizado. Aguardando server_id.`)
              throw new Error(`Aluno ${localAlunoId} ainda não tem server_id`)
            }
          }
        }

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
            // Sessão expirada: apiClient já redirecionou para /login
            console.error('[Sync] Sessão expirada. Sincronização interrompida.')
            setState('error')
            return // Para o loop inteiramente
          }
          if (err.statusCode === 404) {
            // O item não existe no servidor (ex: foi deletado por outro meio).
            // Para evitar loop infinito, removemos da fila.
            console.warn(`[Sync] Servidor retornou 404 para o item ${item.id} (${item.entidade}). Removendo da fila de sync para evitar loop infinito.`)
            await db.sync_queue.delete(item.id!)
            
            // Auto-heal: se era uma atualização de aluno e deu 404, marcamos como failed ou synced para sair do 'local'
            if (item.entidade === 'aluno' && (item.payload as any).local_id) {
              await db.alunos.update((item.payload as any).local_id, { sync_status: 'failed' })
            }
            continue
          }

          // Erro de servidor (4xx/5xx): mantém na fila para próxima tentativa
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
    } finally {
      isSyncing = false
    }

    const remaining = await db.sync_queue.count()
    setState(remaining === 0 ? 'idle' : 'error')
  }, [])

  // Função para baixar os dados do servidor para o Dexie
  const runSyncDown = useCallback(async () => {
    if (!navigator.onLine || isSyncingDown) return
    isSyncingDown = true

    try {
      // 1. Buscar Alunos da API
      const alunosServer = await apiClient.get<any[]>('/api/alunos')

      // 2. Coletar todos os server_ids recebidos para detectar deletados
      const serverIds = new Set(alunosServer.map((a) => a.id))

      // 3. Para cada aluno do servidor, salvar/atualizar no Dexie
      for (const a of alunosServer) {
        const { id: serverId, ...rest } = a
        const dadosServidor = {
          ...rest,
          server_id: serverId,
          sync_status: 'synced' as const,
          conflict_flag: false,
        }

        const existente = await db.alunos
          .where('server_id')
          .equals(serverId)
          .first()

        if (existente) {
          // ── Proteção contra sobrescrever edição offline pendente ──────────
          // Se o registro local tem sync_status 'local', ainda não foi enviado
          // ao servidor — não sobrescrevemos com dados antigos do servidor.
          if (existente.sync_status === 'local') {
            const inQueue = await db.sync_queue
              .where('entidade')
              .equals('aluno')
              .toArray()
            const isPending = inQueue.some(
              (i) => (i.payload as any).local_id === existente.id,
            )
            // Só sobrescreve o órfão (local sem fila) — evita dados malucos
            if (!isPending) {
              await db.alunos.update(existente.id!, dadosServidor)
            }
            // Se está pendente na fila, deixa o dado local intacto
          } else {
            // Registro synced: atualiza normalmente com dados frescos do servidor
            await db.alunos.update(existente.id!, dadosServidor)
          }
        } else {
          // ── Bug fix: put() em vez de add() para evitar duplicatas ─────────
          // Se houver corrida (ex: dois runSyncDown simultâneos), put() é idempotente.
          // add() lançaria ConstraintError e criaria dados duplicados com IDs diferentes.
          await db.alunos.put(dadosServidor)
        }
      }

      // 4. Remover do cache local alunos que foram deletados no servidor
      // (só remove synced — nunca apaga registros locais pendentes)
      const alunosSynced = await db.alunos
        .where('sync_status')
        .equals('synced')
        .toArray()
      const deletados = alunosSynced.filter(
        (a) => a.server_id && !serverIds.has(a.server_id),
      )
      for (const d of deletados) {
        await db.alunos.delete(d.id!)
      }

      console.log(
        `[SyncDown] ${alunosServer.length} alunos atualizados. ${deletados.length} removidos do cache local.`,
      )
    } catch (err) {
      // Não limpa o cache em caso de erro de rede — mantém último estado válido
      console.error('[SyncDown] Erro ao buscar alunos do servidor:', err)
    } finally {
      isSyncingDown = false
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

