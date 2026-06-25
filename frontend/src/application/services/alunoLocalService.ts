/**
 * alunoLocalService.ts — Serviço de Aplicação para operações offline-first sobre Alunos.
 *
 * [Clean Architecture] Camada de Aplicação.
 * - Usa IAlunoRepository (não Dexie diretamente) para persistência.
 * - Usa enqueue() para fila de sincronização.
 *
 * NUNCA acesse db.alunos.add() diretamente em hooks ou componentes —
 * use este serviço para operações de escrita.
 *
 * Regra de prioridade de sync (definida em db.ts):
 *   1 = relatórios (maior prioridade)
 *   2 = alunos e fotos (menor prioridade)
 */

import { alunoRepository } from '@/infrastructure/db/DexieAlunoRepository'
import { enqueue } from '@/infrastructure/db/db'
import type { Aluno } from '@/domain/entities/Aluno'

/**
 * Salva um aluno localmente no IndexedDB via repositório e enfileira sincronização.
 *
 * Dado que dados válidos de aluno são passados,
 * Quando salvarAlunoLocal é chamado,
 * Então MUST persistir com sync_status='local' e enfileirar com prioridade=2.
 *
 * @returns O ID local (numérico, auto-incrementado pelo Dexie) do aluno criado.
 */
export async function salvarAlunoLocal(
  dados: Omit<Aluno, 'id' | 'sync_status' | 'updated_at'>
): Promise<number> {
  // Persiste via repositório concreto (inversão de dependência)
  const id = await alunoRepository.save(dados)

  // Enfileira sync com prioridade correta via enqueue()
  // enqueue() define prioridade=1 para 'relatorio' e prioridade=2 para demais
  await enqueue('aluno', 'create', { ...dados, local_id: id })

  return id
}

/**
 * Atualiza um aluno local via repositório e enfileira sync de atualização.
 *
 * Dado que o aluno com localId existe no IndexedDB,
 * Quando atualizarAlunoLocal é chamado,
 * Então MUST atualizar campos e enfileirar sync se houver server_id.
 */
export async function atualizarAlunoLocal(
  localId: number,
  dados: Partial<Omit<Aluno, 'id' | 'sync_status' | 'updated_at'>>
): Promise<void> {
  await alunoRepository.update(localId, dados)

  // Verifica se tem server_id para enfileirar sync de update
  const aluno = await alunoRepository.getById(localId.toString())
  if (aluno?.server_id) {
    await enqueue('aluno', 'update', { ...dados, server_id: aluno.server_id, local_id: localId })
  }
}
