export interface SyncQueueItem {
  id?: number;
  entidade: 'aluno' | 'relatorio' | 'foto';
  operacao: 'create' | 'update' | 'delete';
  payload: Record<string, unknown>;
  prioridade: 1 | 2;
  criado_em: string;
}
