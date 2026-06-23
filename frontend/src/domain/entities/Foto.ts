import { SyncStatus } from './Aluno';

export interface Foto {
  id?: number;
  server_id?: string;
  aluno_id: number | string;
  tag_pedagogica: 'autonomia' | 'comunicacao' | 'motor_fino' | 'socializacao' | 'outro';
  blob?: Blob;
  url_remote?: string;
  sync_status: SyncStatus;
  created_at: string;
}
