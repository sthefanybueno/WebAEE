import { Aluno } from '../entities/Aluno';

export interface IAlunoRepository {
  getById(id: string): Promise<Aluno | undefined>;
  getAll(status?: 'ativo' | 'arquivado'): Promise<Aluno[]>;
  save(aluno: Omit<Aluno, 'id' | 'sync_status' | 'updated_at'>): Promise<number>;
  update(id: number, aluno: Partial<Omit<Aluno, 'id' | 'sync_status' | 'updated_at'>>): Promise<void>;
}
