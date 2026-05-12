/**
 * lib/db.ts — Dexie.js offline store (IndexedDB)
 * Única fonte de verdade local — conforme design.md
 *
 * Prioridade de sync: 1. relatórios, 2. fotos
 */
import Dexie, { type Table } from 'dexie'

// ─── Tipos locais ──────────────────────────────────────────────────────────

export type SyncStatus = 'synced' | 'pending' | 'conflict'

export interface AlunoLocal {
  id?: number
  server_id?: string
  nome: string
  data_nascimento: string
  escola_atual: string
  diagnostico?: string
  status: 'ativo' | 'arquivado'
  sync_status: SyncStatus
  updated_at: string
}

export interface RelatorioLocal {
  id?: number
  server_id?: string
  aluno_id: string
  tipo: 'diario' | 'mensal' | 'trimestral' | 'pdi'
  conteudo_json: Record<string, unknown>
  sync_status: SyncStatus
  updated_at: string
  autor_nome?: string
}

export interface FotoLocal {
  id?: number
  server_id?: string
  aluno_id: string
  tag_pedagogica: 'autonomia' | 'comunicacao' | 'motor_fino' | 'socializacao' | 'outro'
  blob?: Blob
  url_remote?: string
  sync_status: SyncStatus
  created_at: string
}

export interface SyncQueueItem {
  id?: number
  entidade: 'aluno' | 'relatorio' | 'foto'
  operacao: 'create' | 'update' | 'delete'
  payload: Record<string, unknown>
  prioridade: 1 | 2  // 1=relatórios, 2=fotos
  criado_em: string
}

// ─── Banco ─────────────────────────────────────────────────────────────────

class AeeDatabase extends Dexie {
  alunos!: Table<AlunoLocal>
  relatorios!: Table<RelatorioLocal>
  fotos!: Table<FotoLocal>
  sync_queue!: Table<SyncQueueItem>

  constructor() {
    super('aee_db')
    this.version(1).stores({
      alunos:      '++id, server_id, nome, status, sync_status, updated_at',
      relatorios:  '++id, server_id, aluno_id, tipo, sync_status, updated_at',
      fotos:       '++id, server_id, aluno_id, tag_pedagogica, sync_status, created_at',
      sync_queue:  '++id, entidade, prioridade, criado_em',
    })
  }
}

export const db = new AeeDatabase()

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Adiciona item à fila de sync com prioridade */
export async function enqueue(
  entidade: SyncQueueItem['entidade'],
  operacao: SyncQueueItem['operacao'],
  payload: Record<string, unknown>
) {
  const prioridade = entidade === 'relatorio' ? 1 : 2
  await db.sync_queue.add({
    entidade,
    operacao,
    payload,
    prioridade,
    criado_em: new Date().toISOString(),
  })
}

/** Conta itens pendentes de sync */
export async function countPending(): Promise<number> {
  return db.sync_queue.count()
}
