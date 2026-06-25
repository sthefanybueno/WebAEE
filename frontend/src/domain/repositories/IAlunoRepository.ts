/**
 * IAlunoRepository — Contrato de repositório para a entidade Aluno.
 *
 * [DDD] Esta interface pertence ao Domínio e representa o Port de persistência.
 * As implementações concretas (DexieAlunoRepository, etc.) ficam na Infraestrutura.
 *
 * NUNCA importe Dexie, localStorage ou qualquer dependência de infraestrutura aqui.
 */
import type { Aluno } from '../entities/Aluno'

export interface IAlunoRepository {
  /**
   * Busca um aluno por id local (numérico) ou server_id (UUID).
   * Retorna undefined se não encontrado.
   */
  getById(id: string): Promise<Aluno | undefined>

  /**
   * Retorna todos os alunos, com filtro opcional por status.
   * 'ativo' | 'arquivado' → filtra; undefined → retorna todos.
   */
  getAll(status?: 'ativo' | 'arquivado'): Promise<Aluno[]>

  /**
   * Persiste um novo aluno no repositório local.
   * Retorna o id local gerado (numérico).
   * O sync_status e updated_at são gerenciados pela implementação.
   */
  save(aluno: Omit<Aluno, 'id' | 'sync_status' | 'updated_at'>): Promise<number>

  /**
   * Atualiza campos de um aluno existente por id local.
   * Operação parcial: apenas os campos passados são atualizados.
   */
  update(
    id: number,
    aluno: Partial<Omit<Aluno, 'id' | 'sync_status' | 'updated_at'>>
  ): Promise<void>
}
