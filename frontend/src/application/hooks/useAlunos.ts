'use client'

import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, type AlunoLocal } from '@/infrastructure/db/db'

// Re-export do serviÃ§o para conveniÃªncia dos consumidores que importam daqui
export { salvarAlunoLocal } from '@/application/services/alunoLocalService'

type FiltroSync = 'todos' | 'local' | 'synced'

/**
 * useAlunos — hook reativo que lê do IndexedDB via Dexie.
 *
 * Responsabilidades (Fat Hook / Controller/Adapter):
 *  - Busca reativa via useLiveQuery (atualiza quando IndexedDB muda).
 *  - Filtragem por status de cadastro (ativo/arquivado).
 *  - Filtragem por busca de nome e por status de sync.
 *
 * SyncStatus alinhado com backend (app/domain/value_objects/sync_status.py):
 *   - 'local'  → criado offline, aguardando sincronização
 *   - 'synced' → confirmado pelo servidor
 *   - 'failed' → sync falhou, aguarda reprocessamento
 *
 * NUNCA coloque lógica de filtro nos componentes — passe os parâmetros
 * aqui e deixe o hook aplicar as regras de negócio.
 */
export function useAlunos(
  filtroStatus?: 'ativo' | 'arquivado',
  filtroBusca?: string,
  filtroSync?: FiltroSync,
) {
  const alunos = useLiveQuery(
    () =>
      filtroStatus
        ? db.alunos.where('status').equals(filtroStatus).toArray()
        : db.alunos.toArray(),
    [filtroStatus],
  )

  // Regra de filtro encapsulada no Hook — não no componente de página
  const alunosFiltrados = useMemo(() => {
    if (!alunos) return []
    return alunos.filter((a) => {
      const matchBusca =
        !filtroBusca || a.nome.toLowerCase().includes(filtroBusca.toLowerCase())
      const matchSync =
        !filtroSync ||
        filtroSync === 'todos' ||
        (filtroSync === 'local'   // pendentes: criados offline
          ? a.sync_status === 'local'
          : a.sync_status === 'synced') // sincronizados com sucesso
      return matchBusca && matchSync
    })
  }, [alunos, filtroBusca, filtroSync])

  return {
    alunos: alunosFiltrados,
    loading: alunos === undefined,
  }
}

/** useAluno â€” retorna um aluno especÃ­fico por ID local ou server_id. */
export function useAluno(id: string) {
  const aluno = useLiveQuery(
    async () => {
      // Tenta ID local numÃ©rico primeiro
      const localId = parseInt(id)
      if (!isNaN(localId)) {
        const a = await db.alunos.get(localId)
        if (a) return a
      }
      // Se nÃ£o encontrar, tenta server_id
      return await db.alunos.where('server_id').equals(id).first()
    },
    [id],
  )
  return { aluno, loading: aluno === undefined }
}

/** usePendingCount â€” conta itens nÃ£o sincronizados reativamente via Dexie. */
export function usePendingCount() {
  const count = useLiveQuery(() => db.sync_queue.count(), [])
  return count ?? 0
}

