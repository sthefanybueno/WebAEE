/**
 * lib/services/alunoLocalService.ts
 * ===================================
 * ServiÃ§o de domÃ­nio local para operaÃ§Ãµes offline-first sobre Alunos.
 *
 * Responsabilidades:
 *  - Persistir alunos no IndexedDB (Dexie).
 *  - Enfileirar operaÃ§Ãµes de sync com a prioridade correta.
 *
 * NUNCA instancie db diretamente em hooks ou componentes para
 * operaÃ§Ãµes de escrita â€” use este serviÃ§o.
 *
 * Regra de prioridade (definida em lib/db.ts):
 *   1 = relatÃ³rios (maior prioridade)
 *   2 = fotos e alunos (menor prioridade)
 */

import { db, enqueue, type AlunoLocal } from '@/infrastructure/db/db'

/**
 * Salva um aluno localmente no IndexedDB e enfileira sincronizaÃ§Ã£o.
 *
 * Usa `enqueue()` de lib/db.ts, que conhece a regra de prioridade â€”
 * garantindo que alunos recebam prioridade 2 (nÃ£o 1, que Ã© de relatÃ³rios).
 *
 * @returns O ID local (numÃ©rico, auto-incrementado pelo Dexie) do aluno criado.
 */
export async function salvarAlunoLocal(
  dados: Omit<AlunoLocal, 'id' | 'sync_status' | 'updated_at'>
): Promise<number> {
  const agora = new Date().toISOString()

  // Persiste no IndexedDB com status pendente
  const id = await db.alunos.add({
    ...dados,
    sync_status: 'local',
    updated_at: agora,
  })

  // Enfileira com prioridade correta via enqueue()
  // enqueue() define prioridade=1 para 'relatorio' e prioridade=2 para demais
  await enqueue('aluno', 'create', { ...dados, local_id: id })

  return id as number
}

/**
 * Atualiza um aluno local e enfileira sync de atualizaÃ§Ã£o.
 */
export async function atualizarAlunoLocal(
  localId: number,
  dados: Partial<Omit<AlunoLocal, 'id' | 'sync_status' | 'updated_at'>>
): Promise<void> {
  const agora = new Date().toISOString()

  await db.alunos.update(localId, {
    ...dados,
    sync_status: 'local',
    updated_at: agora,
  })

  const aluno = await db.alunos.get(localId)
  if (aluno?.server_id) {
    await enqueue('aluno', 'update', { ...dados, server_id: aluno.server_id, local_id: localId })
  }
}

