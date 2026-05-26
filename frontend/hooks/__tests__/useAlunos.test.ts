/**
 * hooks/__tests__/useAlunos.test.ts
 * ===================================
 * Testes unitários do hook useAlunos com Vitest + renderHook.
 *
 * Usa @testing-library/react para fornecer o contexto React necessário
 * para useMemo e outros hooks internos.
 *
 * Padrão BDD (Given / When / Then) em todos os testes.
 */

import { renderHook } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { AlunoLocal } from '@/lib/db'

// ── Mocks do Dexie ───────────────────────────────────────────────────────────
// IMPORTANTE: useLiveQuery no mock é SÍNCRONO (chama a fn diretamente).
// Os mocks de db devem retornar valores síncronos (mockReturnValue),
// não Promises (mockResolvedValue), para evitar erros de "filter is not a function".
const mockToArray = vi.fn()
const mockEquals = vi.fn(() => ({ toArray: mockToArray }))
const mockWhere = vi.fn(() => ({ equals: mockEquals }))
const mockAdd = vi.fn().mockResolvedValue(1)     // add() é async — ok como Promise
const mockSyncQueueCount = vi.fn().mockReturnValue(0)
const mockEnqueue = vi.fn().mockResolvedValue(undefined)

vi.mock('@/lib/db', () => ({
  db: {
    alunos: {
      toArray: mockToArray,
      where: mockWhere,
      add: mockAdd,
    },
    sync_queue: {
      count: mockSyncQueueCount,
    },
  },
  enqueue: mockEnqueue,
}))

// ── Mock do dexie-react-hooks ─────────────────────────────────────────────────
// useLiveQuery substituto síncrono — retorna o resultado da função diretamente.
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: () => unknown) => {
    try {
      return fn()
    } catch {
      return undefined
    }
  },
}))

// ── Fixture ───────────────────────────────────────────────────────────────────

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

// ── Testes: useAlunos ─────────────────────────────────────────────────────────

describe('useAlunos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve retornar lista vazia quando não há alunos no banco local', async () => {
    // Given: banco local sem alunos
    // mockReturnValue (síncrono!) — useLiveQuery mock chama a fn diretamente
    mockToArray.mockReturnValue([])

    // When: hook renderizado via renderHook (fornece contexto React correto)
    const { useAlunos } = await import('@/hooks/useAlunos')
    const { result } = renderHook(() => useAlunos())

    // Then
    expect(result.current.alunos).toEqual([])
    expect(result.current.loading).toBe(false)
  })

  it('deve retornar alunos quando existem registros no banco local', async () => {
    // Given: banco local com dois alunos
    const alunos = [makeAluno({ nome: 'Ana Silva' }), makeAluno({ id: 2, nome: 'Pedro Lima' })]
    mockToArray.mockReturnValue(alunos)

    // When
    const { useAlunos } = await import('@/hooks/useAlunos')
    const { result } = renderHook(() => useAlunos())

    // Then
    expect(result.current.alunos).toHaveLength(2)
    expect(result.current.alunos[0].nome).toBe('Ana Silva')
    expect(result.current.loading).toBe(false)
  })

  it('deve filtrar alunos por status quando filtroStatus é fornecido', async () => {
    // Given
    const alunosAtivos = [makeAluno({ status: 'ativo' })]
    mockToArray.mockReturnValue(alunosAtivos)

    // When
    const { useAlunos } = await import('@/hooks/useAlunos')
    renderHook(() => useAlunos('ativo'))

    // Then: o filtro de IndexedDB é aplicado pelo hook, não pelo componente
    expect(mockWhere).toHaveBeenCalledWith('status')
    expect(mockEquals).toHaveBeenCalledWith('ativo')
  })

  it('deve filtrar por busca de nome no hook (não no componente)', async () => {
    // Given: banco com dois alunos
    const alunos = [makeAluno({ nome: 'Ana Silva' }), makeAluno({ id: 2, nome: 'Pedro Lima' })]
    mockToArray.mockReturnValue(alunos)

    // When: filtroBusca='Ana' passado ao hook
    const { useAlunos } = await import('@/hooks/useAlunos')
    const { result } = renderHook(() => useAlunos(undefined, 'Ana'))

    // Then: apenas Ana retornada — filtro aplicado internamente no hook
    expect(result.current.alunos).toHaveLength(1)
    expect(result.current.alunos[0].nome).toBe('Ana Silva')
  })

  it('deve filtrar pendentes de sync no hook (não no componente)', async () => {
    // Given: alunos com estados de sync distintos
    const alunos = [
      makeAluno({ nome: 'Ana', sync_status: 'pending' }),
      makeAluno({ id: 2, nome: 'Pedro', sync_status: 'synced' }),
    ]
    mockToArray.mockReturnValue(alunos)

    // When: filtroSync='pendente'
    const { useAlunos } = await import('@/hooks/useAlunos')
    const { result } = renderHook(() => useAlunos(undefined, undefined, 'pendente'))

    // Then: apenas Ana (pending) retornada
    expect(result.current.alunos).toHaveLength(1)
    expect(result.current.alunos[0].nome).toBe('Ana')
  })

  it('deve retornar loading=true e alunos=[] quando useLiveQuery retorna undefined', async () => {
    // Given: useLiveQuery retorna undefined (estado inicial de carregamento)
    vi.resetModules()
    vi.doMock('@/lib/db', () => ({
      db: {
        alunos: { toArray: vi.fn(), where: mockWhere },
        sync_queue: { count: mockSyncQueueCount },
      },
      enqueue: mockEnqueue,
    }))
    vi.doMock('dexie-react-hooks', () => ({
      useLiveQuery: () => undefined, // undefined = ainda carregando
    }))

    const { useAlunos } = await import('@/hooks/useAlunos')
    const { result } = renderHook(() => useAlunos())

    // Then: loading=true, alunos=[] (nunca undefined exposto ao componente)
    expect(result.current.loading).toBe(true)
    expect(result.current.alunos).toEqual([])
  })
})

// ── Testes: salvarAlunoLocal ──────────────────────────────────────────────────

describe('salvarAlunoLocal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    vi.doMock('@/lib/db', () => ({
      db: {
        alunos: { add: mockAdd, where: mockWhere, toArray: mockToArray },
        sync_queue: { count: mockSyncQueueCount },
      },
      enqueue: mockEnqueue,
    }))
  })

  it('deve salvar aluno localmente e enfileirar sync via enqueue() com prioridade correta', async () => {
    // Given: dados de um novo aluno
    const dadosAluno = {
      nome: 'Beatriz Santos',
      data_nascimento: '2012-03-20',
      escola_atual: 'EMEF Flores',
      status: 'ativo' as const,
    }

    // When: salvarAlunoLocal chamado via serviço (não direto no hook)
    const { salvarAlunoLocal } = await import('@/lib/services/alunoLocalService')
    const id = await salvarAlunoLocal(dadosAluno)

    // Then: aluno adicionado ao IndexedDB com sync_status='pending'
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'Beatriz Santos',
        sync_status: 'pending',
      }),
    )

    // Then: enqueue() chamado (ele aplica prioridade=2 para 'aluno', não 1)
    // prioridade 1 = relatórios (maior urgência), prioridade 2 = alunos/fotos
    expect(mockEnqueue).toHaveBeenCalledWith(
      'aluno',
      'create',
      expect.objectContaining({
        nome: 'Beatriz Santos',
        local_id: 1, // ID retornado pelo mockAdd
      }),
    )

    // Then: retorna o ID gerado pelo Dexie
    expect(id).toBe(1)
  })

  it('NÃO deve chamar sync_queue.add() diretamente (responsabilidade do enqueue)', async () => {
    // Given: mock que confirma que sync_queue.add não é chamado diretamente
    const mockSyncQueueAdd = vi.fn()
    vi.doMock('@/lib/db', () => ({
      db: {
        alunos: { add: mockAdd },
        sync_queue: { add: mockSyncQueueAdd, count: mockSyncQueueCount },
      },
      enqueue: mockEnqueue,
    }))

    // When
    const { salvarAlunoLocal } = await import('@/lib/services/alunoLocalService')
    await salvarAlunoLocal({ nome: 'Teste', status: 'ativo' as const, escola_atual: 'X' })

    // Then: enqueue() é chamado, não sync_queue.add() diretamente
    expect(mockEnqueue).toHaveBeenCalled()
    expect(mockSyncQueueAdd).not.toHaveBeenCalled()
  })
})
