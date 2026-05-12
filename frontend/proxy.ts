import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware de autenticação — protege todas as rotas exceto /login.
 *
 * Estratégia atual: verifica cookie `aee_token` (JWT emitido pelo FastAPI).
 * Quando NextAuth.js for integrado ao backend real, substituir pelo
 * `getToken` do next-auth/jwt.
 *
 * Hierarquia de papéis (RBAC):
 *   coordenacao   → acesso total
 *   prof_aee      → acesso total exceto /admin
 *   prof_apoio    → apenas /dashboard e /relatorios
 *   prof_regente  → apenas /dashboard e /relatorios
 */

const PUBLIC_PATHS = ['/login', '/api/auth']
const ADMIN_PATHS  = ['/admin']

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas — deixa passar
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Verifica presença do token (mock: cookie ou header)
  const token = request.cookies.get('aee_token')?.value

  if (!token) {
    // Redireciona para login preservando destino
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Bloqueia rotas /admin para papéis sem permissão
  // (decodificação real do JWT virá com NextAuth)
  if (ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    // TODO: decodificar payload do JWT e checar `role`
    // Por ora, permite acesso (mock)
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  // Aplica middleware em todas as rotas exceto arquivos estáticos
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)',
  ],
}
