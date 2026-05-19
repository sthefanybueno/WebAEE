/**
 * hooks/__tests__/useAlunos.test.ts
 * ===================================
 * Testes unitários do hook useAlunos com Vitest + mocks do Dexie.
 *
 * Padrão BDD (Given / When / Then) aplicado em todos os testes.
 *
 * O Dexie (IndexedDB) é mockado completamente — nenhum banco real é
 * acessado, tornando os testes rápidos e determinísticos.
 *
 * Como rodar:
 *   cd frontend
 *   npx vitest run hooks/__tests__/useAlunos.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AlunoLocal } from '@/lib/db'

// ── Mock do módulo db (Dexie) ──────────────────────────────────────────────
// Precisa ser declarado antes de qualquer import do hook.

const mockToArray = vi.fn()
const mockEquals = vi.fn(() => ({ toArray: mockToArray }))
const mockWhere = vi.fn(() => ({ equals: mockEquals }))

vi.mock('@/lib/db', () => ({
  db: {
    alunos: {
      toArray: mockToArray,
      where: mockWhere,
    },
    sync_queue: {
      count: vi.fn().mockResolvedValue(0),
    },
  },
}))

// ── Mock do dexie-react-hooks ──────────────────────────────────────────────
// useLiveQuery é substituído por uma versão síncrona para testes.
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: () => unknown) => {
    // Executa a query factory e retorna o resultado (simulando estado resolvido)
    try {
      return fn()
    } catch {
      return undefined
    }
  },
}))

// ── Fixtures ────────────────────────────────────────────────────────────────

function makeAluno(overrides: Partial<AlunoLocal> = {}): AlunoLocal {
  return {
    id: 1,
    server_id: 'uuid-1',
    nome: 'Ana Silva',
    data_nascimento: '2010-05-15',
    escola_atual: 'EMEF João de Barro',
    status: 'ativo',
    sync_status: 'synced',
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

// ── Testes ──────────────────────────────────────────────────────────────────

describe('useAlunos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar lista vazia quando não há alunos no banco local', async () => {
    // Given: banco local sem alunos
    mockToArray.mockResolvedValue([])

    // When: hook é chamado sem filtro de status
    const { useAlunos } = await import('@/hooks/useAlunos')
    const result = useAlunos()

    // Then: lista deve ser vazia e loading deve ser false
    expect(result.alunos).toEqual([])
    expect(result.loading).toBe(false)
  })

  it('deve retornar alunos quando existem registros no banco local', async () => {
    // Given: banco local com dois alunos
    const alunos = [makeAluno({ nome: 'Ana Silva' }), makeAluno({ id: 2, nome: 'Pedro Lima' })]
    mockToArray.mockResolvedValue(alunos)

    // When: hook é chamado sem filtro
    const { useAlunos } = await import('@/hooks/useAlunos')
    const result = useAlunos()

    // Then: deve retornar os dois alunos
    expect(result.alunos).toHaveLength(2)
    expect(result.alunos[0].nome).toBe('Ana Silva')
    expect(result.loading).toBe(false)
  })

  it('deve filtrar alunos por status quando filtroStatus é fornecido', async () => {
    // Given: banco local com alunos ativos
    const alunosAtivos = [makeAluno({ status: 'ativo' })]
    mockToArray.mockResolvedValue(alunosAtivos)

    // When: hook é chamado com filtro 'ativo'
    const { useAlunos } = await import('@/hooks/useAlunos')
    useAlunos('ativo')

    // Then: deve chamar db.alunos.where('status').equals('ativo')
    expect(mockWhere).toHaveBeenCalledWith('status')
    expect(mockEquals).toHaveBeenCalledWith('ativo')
  })

  it('deve retornar loading=true quando alunos são undefined (carregando)', async () => {
    // Given: useLiveQuery retorna undefined (estado carregando)
    mockToArray.mockResolvedValue(undefined)

    // When: hook é invocado com resultado pendente
    // Simulamos o estado de loading substituindo o mock temporariamente
    vi.doMock('dexie-react-hooks', () => ({
      useLiveQuery: () => undefined, // undefined = carregando
    }))

    // Reimporta o hook para pegar o novo mock
    vi.resetModules()
    vi.doMock('@/lib/db', () => ({
      db: {
        alunos: { toArray: mockToArray, where: mockWhere },
        sync_queue: { count: vi.fn().mockResolvedValue(0) },
      },
    }))
    vi.doMock('dexie-react-hooks', () => ({
      useLiveQuery: () => undefined,
    }))

    const { useAlunos: useAlunosLoading } = await import('@/hooks/useAlunos')
    const result = useAlunosLoading()

    // Then: loading deve ser true, alunos deve ser array vazio (não undefined)
    expect(result.loading).toBe(true)
    expect(result.alunos).toEqual([])
  })
})

describe('salvarAlunoLocal', () => {
  const mockAdd = vi.fn().mockResolvedValue(1)
  const mockSyncQueueAdd = vi.fn().mockResolvedValue(1)

  beforeEach(() => {
    vi.clearAllMocks()
    vi.doMock('@/lib/db', () => ({
      db: {
        alunos: { add: mockAdd, where: mockWhere, toArray: mockToArray },
        sync_queue: { add: mockSyncQueueAdd, count: vi.fn().mockResolvedValue(1) },
      },
    }))
    vi.resetModules()
  })

  it('deve salvar aluno localmente e enfileirar sync', async () => {
    // Given: dados de um novo aluno
    const dadosAluno = {
      nome: 'Beatriz Santos',
      data_nascimento: '2012-03-20',
      escola_atual: 'EMEF Flores',
      status: 'ativo' as const,
    }

    // When: salvarAlunoLocal é chamado
    const { salvarAlunoLocal } = await import('@/hooks/useAlunos')
    await salvarAlunoLocal(dadosAluno)

    // Then: aluno deve ser adicionado ao banco local
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'Beatriz Santos',
        sync_status: 'pending',
      }),
    )

    // Then: item deve ser enfileirado para sync
    expect(mockSyncQueueAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        entidade: 'aluno',
        operacao: 'create',
        prioridade: 1,
      }),
    )
  })
})
