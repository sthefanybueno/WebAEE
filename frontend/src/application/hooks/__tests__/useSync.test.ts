/**
 * hooks/__tests__/useSync.test.ts
 * ==================================
 * Testes unitários do hook useSync (cobertura dos fluxos críticos).
 *
 * Padrão BDD (Given / When / Then) em todos os testes.
 * Mock de navigator.onLine, apiClient e Dexie.
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Mocks do Dexie ────────────────────────────────────────────────────────────

const mockSyncQueueCount    = vi.fn().mockReturnValue(0)
const mockSyncQueueOrderBy  = vi.fn()
const mockSyncQueueDelete   = vi.fn().mockResolvedValue(undefined)
const mockSyncQueueAdd      = vi.fn().mockResolvedValue(1)
const mockAlunos            = { filter: vi.fn(), update: vi.fn(), where: vi.fn() }

vi.mock('@/infrastructure/db/db', () => ({
  db: {
    sync_queue: {
      count:   mockSyncQueueCount,
      orderBy: mockSyncQueueOrderBy,
      delete:  mockSyncQueueDelete,
      add:     mockSyncQueueAdd,
    },
    alunos: mockAlunos,
  },
}))

// ── Mock dexie-react-hooks ────────────────────────────────────────────────────
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: () => unknown) => {
    try { return fn() } catch { return 0 }
  },
}))

// ── Mock apiClient ────────────────────────────────────────────────────────────
const mockApiGet    = vi.fn()
const mockApiPost   = vi.fn()
const mockApiPut    = vi.fn()
const mockApiDelete = vi.fn()

vi.mock('@/infrastructure/http/client', () => ({
  apiClient: {
    get:    (...args: any[]) => mockApiGet(...args),
    post:   (...args: any[]) => mockApiPost(...args),
    put:    (...args: any[]) => mockApiPut(...args),
    delete: (...args: any[]) => mockApiDelete(...args),
  },
  ApiError: class ApiError extends Error {
    statusCode: number
    detail: any
    constructor(statusCode: number, detail: any) {
      super(String(detail))
      this.statusCode = statusCode
      this.detail = detail
    }
  },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    configurable: true,
    value,
  })
}

// ── Testes: useSync ───────────────────────────────────────────────────────────

describe('useSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setOnline(true)
    // Por padrão: fila vazia e alunos sem órfãos
    mockSyncQueueOrderBy.mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
    mockAlunos.filter.mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) })
  })

  afterEach(() => {
    setOnline(true)
  })

  it('deve inicializar com state=idle e pendingCount=0', async () => {
    // Given: fila vazia, sem pendentes
    mockSyncQueueCount.mockReturnValue(0)

    // When: hook renderizado
    const { useSync } = await import('@/application/hooks/useSync')
    const { result } = renderHook(() => useSync())

    // Then: estado inicial correto
    expect(result.current.state).toBe('idle')
    expect(result.current.pendingCount).toBe(0)
  })

  it('deve expor runSync como função', async () => {
    // Given/When: hook renderizado
    const { useSync } = await import('@/application/hooks/useSync')
    const { result } = renderHook(() => useSync())

    // Then: funções expostas existem
    expect(typeof result.current.runSync).toBe('function')
    expect(typeof result.current.runSyncDown).toBe('function')
  })

  it('dado offline, runSync deve definir state=offline sem chamar a API', async () => {
    // Given: dispositivo offline
    setOnline(false)
    const { useSync } = await import('@/application/hooks/useSync')
    const { result } = renderHook(() => useSync())

    // When: runSync chamado offline
    await act(async () => {
      await result.current.runSync()
    })

    // Then: estado offline, API não chamada
    expect(result.current.state).toBe('offline')
    expect(mockApiPost).not.toHaveBeenCalled()
    expect(mockApiPut).not.toHaveBeenCalled()
  })

  it('dado fila vazia e sem órfãos, runSync deve manter state=idle', async () => {
    // Given: fila vazia, sem alunos órfãos
    mockSyncQueueOrderBy.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    })
    mockAlunos.filter.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    })

    const { useSync } = await import('@/application/hooks/useSync')
    const { result } = renderHook(() => useSync())

    // When: runSync com fila vazia
    await act(async () => {
      await result.current.runSync()
    })

    // Then: permanece idle, sem chamadas à API
    expect(result.current.state).toBe('idle')
    expect(mockApiPost).not.toHaveBeenCalled()
  })

  it('dado item create na fila, runSync deve chamar POST e remover da fila', async () => {
    // Given: um item 'create' de aluno na fila
    const queueItem = {
      id: 1,
      entidade: 'aluno',
      operacao: 'create',
      payload: {
        nome: 'Teste Aluno',
        local_id: 42,
        consentimento_lgpd: true,
        escola_atual: 'EMEF Teste',
        data_nascimento: '2010-01-01',
        status: 'ativo',
      },
      prioridade: 2,
      criado_em: new Date().toISOString(),
    }
    mockSyncQueueOrderBy.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([queueItem]),
    })
    mockApiPost.mockResolvedValue({ id: 'server-uuid-123' })
    mockAlunos.update = vi.fn().mockResolvedValue(undefined)
    mockSyncQueueCount.mockReturnValue(0)

    const { useSync } = await import('@/application/hooks/useSync')
    const { result } = renderHook(() => useSync())

    // When: runSync executa com item na fila
    await act(async () => {
      await result.current.runSync()
    })

    // Then: POST chamado, item removido da fila, aluno atualizado com server_id
    expect(mockApiPost).toHaveBeenCalledWith(
      '/api/alunos',
      expect.objectContaining({ nome: 'Teste Aluno' })
    )
    expect(mockSyncQueueDelete).toHaveBeenCalledWith(1)
    expect(mockAlunos.update).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ sync_status: 'synced', server_id: 'server-uuid-123' })
    )
  })

  it('dado item update na fila, runSync deve chamar PUT com server_id correto', async () => {
    // Given: item de update com server_id
    const queueItem = {
      id: 2,
      entidade: 'aluno',
      operacao: 'update',
      payload: {
        local_id: 10,
        server_id: 'server-uuid-abc',
        nome: 'Aluno Atualizado',
        consentimento_lgpd: true,
      },
      prioridade: 2,
      criado_em: new Date().toISOString(),
    }
    mockSyncQueueOrderBy.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([queueItem]),
    })
    mockApiPut.mockResolvedValue({ id: 'server-uuid-abc' })
    mockAlunos.update = vi.fn().mockResolvedValue(undefined)
    mockSyncQueueCount.mockReturnValue(0)

    const { useSync } = await import('@/application/hooks/useSync')
    const { result } = renderHook(() => useSync())

    // When
    await act(async () => {
      await result.current.runSync()
    })

    // Then: PUT chamado com server_id na URL
    expect(mockApiPut).toHaveBeenCalledWith(
      '/api/alunos/server-uuid-abc',
      expect.objectContaining({ nome: 'Aluno Atualizado' })
    )
    expect(mockSyncQueueDelete).toHaveBeenCalledWith(2)
  })

  it('dado erro 401, runSync deve parar o loop e definir state=error', async () => {
    // Given: item na fila e API retorna 401
    const { ApiError } = await import('@/infrastructure/http/client')
    const queueItem = {
      id: 3,
      entidade: 'aluno',
      operacao: 'create',
      payload: { local_id: 5, consentimento_lgpd: true, nome: 'X' },
      prioridade: 2,
      criado_em: new Date().toISOString(),
    }
    mockSyncQueueOrderBy.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([queueItem]),
    })
    mockApiPost.mockRejectedValue(new ApiError(401, 'Sessão expirada'))
    mockSyncQueueCount.mockReturnValue(1) // ainda tem pendente

    const { useSync } = await import('@/application/hooks/useSync')
    const { result } = renderHook(() => useSync())

    // When
    await act(async () => {
      await result.current.runSync()
    })

    // Then: state=error, loop parado (não tentou próximo item)
    expect(result.current.state).toBe('error')
    // Fila NÃO removida em 401 (apenas em 404)
    expect(mockSyncQueueDelete).not.toHaveBeenCalled()
  })

  it('dado erro 404, runSync deve remover o item da fila e continuar', async () => {
    // Given: item update com 404 (aluno deletado no servidor)
    const { ApiError } = await import('@/infrastructure/http/client')
    const queueItem = {
      id: 4,
      entidade: 'aluno',
      operacao: 'update',
      payload: { local_id: 7, server_id: 'uuid-deletado', nome: 'Ghost' },
      prioridade: 2,
      criado_em: new Date().toISOString(),
    }
    mockSyncQueueOrderBy.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([queueItem]),
    })
    mockApiPut.mockRejectedValue(new ApiError(404, 'Not found'))
    mockAlunos.update = vi.fn().mockResolvedValue(undefined)
    mockSyncQueueCount.mockReturnValue(0)

    const { useSync } = await import('@/application/hooks/useSync')
    const { result } = renderHook(() => useSync())

    // When
    await act(async () => {
      await result.current.runSync()
    })

    // Then: item removido da fila para evitar loop infinito
    expect(mockSyncQueueDelete).toHaveBeenCalledWith(4)
    // Aluno marcado como 'failed'
    expect(mockAlunos.update).toHaveBeenCalledWith(7, { sync_status: 'failed' })
  })
})
