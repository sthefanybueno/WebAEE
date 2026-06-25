'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Users, FileText, Calendar, Camera,
  UserCog, LogOut, X,
} from 'lucide-react'
import { usePapel } from '@/application/hooks/usePapel'

const MAIN_NAV = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/alunos', label: 'Alunos', Icon: Users },
  { href: '/relatorios', label: 'Relatórios', Icon: FileText },
  { href: '/horarios', label: 'Horários', Icon: Calendar },
  { href: '/momentos/registrar', label: 'Momentos', Icon: Camera },
]

const SYS_NAV = [
  { href: '/escolas', label: 'Escolas', Icon: FileText },
  { href: '/admin/usuarios', label: 'Usuários', Icon: UserCog },
  { href: '/login', label: 'Sair', Icon: LogOut },
]

interface Props {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

function Logo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M9 1.5C9 1.5 3 4.5 3 10.5C3 13.814 5.686 16.5 9 16.5C9 16.5 9 10.5 15 7.5C15 7.5 13 1.5 9 1.5Z"
        fill="rgba(255,255,255,0.92)"
      />
      <path
        d="M9 16.5C9 16.5 9 9.5 12.5 6.5"
        stroke="rgba(26,111,69,0.45)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M7 5.5C7 5.5 4.5 7.5 4.5 11"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Sidebar({ collapsed, mobileOpen, onMobileClose }: Props) {
  const pathname = usePathname()
  const usuario = usePapel()

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))

  const wClass = collapsed ? 'w-[68px]' : 'w-[252px]'
  const mobileClass = mobileOpen ? 'translate-x-0' : '-translate-x-full'

  return (
    <>
      {/* Overlay mobile */}
      <div
        className={`fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40 transition-opacity duration-200 lg:hidden ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      <aside
        className={`fixed top-0 left-0 bottom-0 flex flex-col z-50 bg-gradient-to-b from-[#1d7e4f] via-[#1A6F45] to-[#155e3a] transition-all duration-200 shadow-xl lg:translate-x-0 ${wClass} ${mobileClass}`}
        aria-label="Navegação principal"
      >
        {/* Brand */}
        <div className="h-16 flex items-center px-3 gap-3 shrink-0 border-b border-white/10">
          <div className="w-8 h-8 rounded-lg shrink-0 bg-white/10 border border-white/20 flex items-center justify-center shadow-sm">
            <Logo />
          </div>

          <div className={`flex flex-col overflow-hidden transition-all duration-200 ${collapsed ? 'opacity-0 max-w-0' : 'max-w-[200px]'}`}>
            <span className="text-sm font-bold text-white whitespace-nowrap leading-tight tracking-tight">Sistema AEE</span>
            <span className="text-[10px] font-medium text-white/50 whitespace-nowrap uppercase tracking-widest">Ed. Especializado</span>
          </div>

          <div className="flex-1" />

          {/* Close Mobile */}
          <button
            onClick={onMobileClose}
            className="lg:hidden flex items-center justify-center w-7 h-7 rounded-md bg-white/10 text-white shrink-0"
            aria-label="Fechar menu"
          >
            <X size={14} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 custom-scrollbar">
          <p className={`text-[10px] font-bold tracking-widest uppercase text-white/30 px-2 py-2 whitespace-nowrap transition-opacity duration-200 ${collapsed ? 'opacity-0' : ''}`}>
            Principal
          </p>

          <div className="space-y-1">
            {MAIN_NAV.filter(item => {
              if (usuario?.papel === 'prof_apoio') {
                return !['/horarios'].includes(item.href)
              }
              if (usuario?.papel === 'prof_regente') {
                return item.href !== '/horarios'
              }
              return true
            }).map(({ href, label, Icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onMobileClose}
                  className={`group relative flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap overflow-hidden transition-colors ${active ? 'bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]' : 'text-white/60 hover:bg-white/10 hover:text-white/90'
                    }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white/85 rounded-r-sm" />}
                  <Icon size={18} className="shrink-0" />
                  <span className={`transition-all duration-200 ${collapsed ? 'opacity-0 max-w-0' : 'max-w-[180px]'}`}>{label}</span>

                  {collapsed && (
                    <span className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 bg-slate-900 border border-white/10 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md whitespace-nowrap shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                      {label}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          <div className="h-px bg-white/10 my-4 mx-2" />

          <p className={`text-[10px] font-bold tracking-widest uppercase text-white/30 px-2 py-2 whitespace-nowrap transition-opacity duration-200 ${collapsed ? 'opacity-0' : ''}`}>
            Sistema
          </p>

          <div className="space-y-1">
            {SYS_NAV.filter(item => {
              if (usuario?.papel === 'prof_apoio' || usuario?.papel === 'prof_regente') {
                return item.href === '/login' // Só vê Sair
              }
              return true
            }).map(({ href, label, Icon }) => {
              const active = isActive(href)
              
              if (href === '/login') {
                return (
                  <button
                    key={href}
                    onClick={() => {
                      localStorage.removeItem('aee_token')
                      document.cookie = 'aee_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
                      window.location.href = '/login'
                    }}
                    className={`w-full group relative flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap overflow-hidden transition-colors text-white/60 hover:bg-white/10 hover:text-white/90`}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className={`transition-all duration-200 text-left ${collapsed ? 'opacity-0 max-w-0' : 'max-w-[180px]'}`}>{label}</span>

                    {collapsed && (
                      <span className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 bg-slate-900 border border-white/10 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md whitespace-nowrap shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                        {label}
                      </span>
                    )}
                  </button>
                )
              }

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onMobileClose}
                  className={`group relative flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap overflow-hidden transition-colors ${active ? 'bg-white/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]' : 'text-white/60 hover:bg-white/10 hover:text-white/90'
                    }`}
                >
                  {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white/85 rounded-r-sm" />}
                  <Icon size={18} className="shrink-0" />
                  <span className={`transition-all duration-200 ${collapsed ? 'opacity-0 max-w-0' : 'max-w-[180px]'}`}>{label}</span>

                  {collapsed && (
                    <span className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 bg-slate-900 border border-white/10 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md whitespace-nowrap shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                      {label}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer User */}
        <div className="p-2 border-t border-white/10 shrink-0">
          <Link href="/perfil" className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-full shrink-0 bg-gradient-to-br from-white/20 to-white/5 border border-white/10 flex items-center justify-center text-white text-xs font-bold tracking-wide">
              {usuario?.nome ? usuario.nome.substring(0, 2).toUpperCase() : 'US'}
            </div>
            <div className={`overflow-hidden transition-all duration-200 ${collapsed ? 'opacity-0 max-w-0' : 'max-w-[180px] flex-1'}`}>
              <p className="text-xs font-semibold text-white whitespace-nowrap truncate pr-2">{usuario?.nome || 'Usuário'}</p>
              <p className="text-[10px] text-white/50 whitespace-nowrap truncate pr-2">
                {usuario?.papel ? ({
                  'admin': 'Administrador',
                  'coordenacao': 'Coordenação',
                  'prof_aee': 'Professor AEE',
                  'prof_regente': 'Professor Regente',
                  'prof_apoio': 'Professor de Apoio'
                }[usuario.papel] || usuario.papel) : 'Carregando...'}
              </p>
            </div>
            {!collapsed && (
              <UserCog size={14} className="text-white/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            )}
          </Link>
        </div>
      </aside>
    </>
  )
}

export function useSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  return {
    collapsed,
    mobileOpen,
    toggle: () => setCollapsed(c => !c),
    openMobile: () => setMobileOpen(true),
    closeMobile: () => setMobileOpen(false),
  }
}
