import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Lê o cookie que é setado no login
  const token = request.cookies.get('aee_token')?.value
  
  // Lista de rotas públicas (que não precisam de login)
  const publicRoutes = ['/login']
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  
  // Se não tem token e a rota não é pública, redireciona para o login
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Se tem token e está acessando a tela de login, redireciona para o dashboard
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Protege todas as rotas da aplicação exceto API, Next.js estáticos e imagens
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
