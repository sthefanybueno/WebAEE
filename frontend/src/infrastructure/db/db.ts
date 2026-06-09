/**
 * lib/db.ts — Dexie.js offline store (IndexedDB)
 * Única fonte de verdade local — conforme design.md
 *
 * Prioridade de sync: 1. relatórios, 2. fotos
 */
import Dexie, { type Table } from 'dexie'
import type { Aluno, SyncStatus } from '@/domain/entities/Aluno'
import type { Foto } from '@/domain/entities/Foto'
import type { Relatorio } from '@/domain/entities/Relatorio'
import type { SyncQueueItem } from '@/domain/entities/Sync'

// Re-exportações para compatibilidade retroativa
export type { Aluno as AlunoLocal, SyncStatus }
export type { Foto as FotoLocal }
export type { Relatorio as RelatorioLocal }
export type { SyncQueueItem }

// ─── Banco ─────────────────────────────────────────────────────────────────

class AeeDatabase extends Dexie {
  alunos!: Table<Aluno>
  relatorios!: Table<Relatorio>
  fotos!: Table<Foto>
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
