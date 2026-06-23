/**
 * lib/services/fotoLocalService.ts
 * ===================================
 * ServiÃ§o de aplicaÃ§Ã£o/infraestrutura local para momentos pedagÃ³gicos (fotos).
 */

import { db, enqueue } from '@/infrastructure/db/db'

export async function salvarFotoLocal(
  alunoId: number | string,
  blob: Blob,
  tag: 'autonomia' | 'comunicacao' | 'motor_fino' | 'socializacao' | 'outro'
): Promise<number> {
  const agora = new Date().toISOString()

  // 1. Salva foto como Blob no Dexie
  const fotoId = await db.fotos.add({
    aluno_id: alunoId,
    blob,
    tag_pedagogica: tag,
    sync_status: 'local',
    created_at: agora
  })

  // 2. Cria registro na fila de sync com a prioridade correta via enqueue()
  // enqueue() mapeia a prioridade=2 para fotos
  await enqueue('foto', 'create', {
    aluno_id: alunoId.toString(),
    tag,
    local_foto_id: fotoId
  })

  return fotoId
}

