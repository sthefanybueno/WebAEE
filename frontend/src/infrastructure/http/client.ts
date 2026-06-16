/**
 * lib/api/client.ts — Cliente HTTP centralizado do Sistema AEE
 * =============================================================
 * Fonte única de verdade para chamadas à API backend.
 *
 * Responsabilidades:
 *  - Injetar o token JWT em todos os requests automaticamente.
 *  - Tratar 401 (sessão expirada): limpa storage e redireciona para /login.
 *  - Lançar `ApiError` tipado em vez de deixar erros HTTP silenciosos.
 *  - Expor interface de alto nível: apiClient.get / .post / .put / .delete
 *
 * NUNCA faça fetch() direto nos hooks ou componentes — use apiClient.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// ── Tipos ──────────────────────────────────────────────────────────────────

/** Erro tipado que carrega o status HTTP e o detalhe da API. */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly detail: any,
  ) {
    super(typeof detail === 'string' ? detail : JSON.stringify(detail))
    this.name = 'ApiError'
  }
}

// ── Função base ────────────────────────────────────────────────────────────

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('aee_token') : null

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  // Token expirado: limpa sessão e redireciona imediatamente
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aee_token')
      window.location.href = '/login'
    }
    throw new ApiError(401, 'Sessão expirada. Faça login novamente.')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new ApiError(res.status, (body as { detail?: any }).detail ?? body ?? 'Erro desconhecido')
  }

  // 204 No Content não possui body
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

// ── Interface pública ──────────────────────────────────────────────────────

export const apiClient = {
  get: <T>(path: string) =>
    request<T>(path),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
}
