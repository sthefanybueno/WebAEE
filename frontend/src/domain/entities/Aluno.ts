export type SyncStatus = 'synced' | 'pending' | 'conflict';

export interface Aluno {
  id?: number;
  server_id?: string;
  nome: string;
  data_nascimento: string;
  escola_atual: string;
  diagnostico?: string;
  status: 'ativo' | 'arquivado';
  sync_status: SyncStatus;
  updated_at: string;
}
