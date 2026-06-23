/**
 * Sistema AEE — Entidade de Domínio: Notificação
 *
 * Alinhada com o backend (app/domain/entities/notification.py).
 */

export interface Notificacao {
  id: string
  tenantId: string
  autorId: string
  tipo: 'relatorio_criado' | 'aluno_cadastrado' | string
  mensagem: string
  relatorioId?: string
  alunoId?: string
  lida: boolean
  createdAt: string
}
