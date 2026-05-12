'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { db, type AlunoLocal, type SyncStatus } from '@/lib/db'

/**
 * useAlunos — hook reativo que lê do IndexedDB via Dexie.
 * Retorna dados em tempo real; a UI atualiza automaticamente quando
 * o banco local muda (ex: após sync com o servidor).
 */
export function useAlunos(filtroStatus?: 'ativo' | 'arquivado') {
  const alunos = useLiveQuery(
    () => filtroStatus
      ? db.alunos.where('status').equals(filtroStatus).toArray()
      : db.alunos.toArray(),
    [filtroStatus]
  )

  return {
    alunos: alunos ?? [],
    loading: alunos === undefined,
  }
}

export function useAluno(id: string) {
  const aluno = useLiveQuery(
    async () => {
      // Tenta ID local numérico primeiro
      const localId = parseInt(id)
      if (!isNaN(localId)) {
        const a = await db.alunos.get(localId)
        if (a) return a
      }
      // Se não encontrar, tenta server_id
      return await db.alunos.where('server_id').equals(id).first()
    },
    [id]
  )
  return { aluno, loading: aluno === undefined }
}

/** usePendingCount — conta relatórios + fotos não sincronizados */
export function usePendingCount() {
  const count = useLiveQuery(
    () => db.sync_queue.count(),
    []
  )
  return count ?? 0
}

/** Salva ou atualiza um aluno localmente e enfileira sync */
export async function salvarAlunoLocal(dados: Omit<AlunoLocal, 'id' | 'sync_status' | 'updated_at'>) {
  const agora = new Date().toISOString()
  const id = await db.alunos.add({
    ...dados,
    sync_status: 'pending' as SyncStatus,
    updated_at: agora,
  })
  await db.sync_queue.add({
    entidade: 'aluno',
    operacao: 'create',
    payload: { ...dados, local_id: id },
    prioridade: 1,
    criado_em: agora,
  })
  return id
}
