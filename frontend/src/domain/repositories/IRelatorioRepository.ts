/**
 * IRelatorioRepository — Contrato de repositório para a entidade Relatorio.
 *
 * [DDD] Port de persistência local para relatórios pedagógicos.
 * Implementações concretas ficam na Infraestrutura (DexieRelatorioRepository).
 */
import type { Relatorio } from '../entities/Relatorio'

export interface IRelatorioRepository {
  /**
   * Busca um relatório por id local ou server_id.
   */
  getById(id: string): Promise<Relatorio | undefined>

  /**
   * Retorna todos os relatórios de um aluno específico.
   */
  getAllByAluno(alunoId: string): Promise<Relatorio[]>

  /**
   * Persiste um novo relatório no repositório local.
   * Retorna o id local gerado.
   */
  save(relatorio: Omit<Relatorio, 'id' | 'sync_status' | 'updated_at'>): Promise<number>

  /**
   * Atualiza campos de um relatório existente por id local.
   */
  update(
    id: number,
    relatorio: Partial<Omit<Relatorio, 'id' | 'sync_status' | 'updated_at'>>
  ): Promise<void>
}
