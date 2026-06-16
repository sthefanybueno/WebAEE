/**
 * Sistema AEE — Entidade de Domínio: Aluno
 *
 * SyncStatus alinhado com o backend (app/domain/value_objects/sync_status.py):
 *   - 'local'  → criado offline, ainda não enviado ao servidor
 *   - 'synced' → sincronização bem-sucedida com o servidor
 *   - 'failed' → tentativa de sync falhou; aguarda reprocessamento
 *
 * NOTA: 'conflict' NÃO é um SyncStatus — é o campo separado `conflict_flag: boolean`
 * (ver Aluno.conflict_flag). Este alinhamento elimina a divergência com o backend.
 */
export type SyncStatus = 'local' | 'synced' | 'failed';

export interface Aluno {
  id?: number;
  server_id?: string;
  nome: string;
  data_nascimento: string;
  escola_atual: string;
  escola_atual_id?: string;      // UUID do backend (opcional para compatibilidade com dados offline antigos)
  consentimento_lgpd?: boolean;  // Obrigatório no backend; pode ser undefined em dados offline legados
  diagnostico?: string;
  status: 'ativo' | 'arquivado';
  sync_status: SyncStatus;
  conflict_flag?: boolean;   // campo separado do sync_status — True quando merge offline detectou colisão
  updated_at: string;
}


