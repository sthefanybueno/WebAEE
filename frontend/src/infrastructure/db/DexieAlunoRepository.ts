/**
 * DexieAlunoRepository — Implementação concreta de IAlunoRepository via Dexie/IndexedDB.
 *
 * [Clean Architecture] Esta classe é o Adaptador de Persistência Local.
 * Satisfaz o contrato IAlunoRepository definido no Domínio, sem que o
 * Domínio conheça Dexie, IndexedDB ou qualquer detalhe de infraestrutura.
 *
 * Os Hooks (camada de Aplicação) devem injetar/usar esta implementação
 * em vez de acessar `db.alunos` diretamente.
 */
import { db } from '@/infrastructure/db/db'
import type { IAlunoRepository } from '@/domain/repositories/IAlunoRepository'
import type { Aluno } from '@/domain/entities/Aluno'

export class DexieAlunoRepository implements IAlunoRepository {
  /**
   * Busca um aluno por server_id (UUID) ou por id local (number como string).
   *
   * Dado que o aluno existe no IndexedDB com o server_id informado,
   * Quando getById é chamado,
   * Então MUST retornar o aluno correspondente ou undefined.
   */
  async getById(id: string): Promise<Aluno | undefined> {
    // Tenta como ID local numérico primeiro (gerado pelo Dexie)
    const localId = parseInt(id)
    if (!isNaN(localId)) {
      const aluno = await db.alunos.get(localId)
      if (aluno) return aluno
    }
    // Fallback: busca por server_id (UUID do backend)
    return db.alunos.where('server_id').equals(id).first()
  }

  /**
   * Retorna todos os alunos, com filtro opcional por status.
   *
   * Dado que alunos existem no IndexedDB,
   * Quando getAll é chamado com status='ativo',
   * Então MUST retornar apenas alunos com status='ativo'.
   */
  async getAll(status?: 'ativo' | 'arquivado'): Promise<Aluno[]> {
    if (status) {
      return db.alunos.where('status').equals(status).toArray()
    }
    return db.alunos.toArray()
  }

  /**
   * Persiste um novo aluno no IndexedDB e retorna o id local gerado.
   *
   * Dado que um aluno válido é passado,
   * Quando save é chamado,
   * Então MUST persistir no IndexedDB com sync_status='local' e updated_at atual.
   */
  async save(
    aluno: Omit<Aluno, 'id' | 'sync_status' | 'updated_at'>
  ): Promise<number> {
    return db.alunos.add({
      ...aluno,
      sync_status: 'local',
      updated_at: new Date().toISOString(),
    })
  }

  /**
   * Atualiza campos de um aluno existente por id local.
   *
   * Dado que um aluno com o id informado existe,
   * Quando update é chamado,
   * Então MUST atualizar os campos informados sem sobrescrever os demais.
   */
  async update(
    id: number,
    aluno: Partial<Omit<Aluno, 'id' | 'sync_status' | 'updated_at'>>
  ): Promise<void> {
    await db.alunos.update(id, aluno)
  }
}

/** Instância singleton para uso nos hooks — inversão de dependência. */
export const alunoRepository = new DexieAlunoRepository()
