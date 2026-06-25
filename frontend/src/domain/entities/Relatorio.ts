import { SyncStatus } from './Aluno';

export interface Relatorio {
  id?: number;
  server_id?: string;
  aluno_id: string;
  tipo: 'diario' | 'mensal' | 'trimestral' | 'pdi';
  conteudo_json: Record<string, unknown>;
  conteudo?: string;
  data_referencia?: string;
  sync_status: SyncStatus;
  updated_at: string;
  autor_nome?: string;
}
