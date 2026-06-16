'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Users, FileText, Calendar, Camera,
  UserCog, LogOut, ChevronLeft, ChevronRight, X,
} from 'lucide-react'

const MAIN_NAV = [
  { href: '/dashboard',          label: 'Dashboard',         Icon: LayoutDashboard },
  { href: '/alunos',             label: 'Alunos',            Icon: Users },
  { href: '/relatorios',         label: 'Relatórios',        Icon: FileText },
  { href: '/horarios',           label: 'Horários',          Icon: Calendar },
  { href: '/momentos/registrar', label: 'Momentos',          Icon: Camera },
]

const SYS_NAV = [
  { href: '/escolas',        label: 'Escolas',  Icon: FileText },
  { href: '/admin/usuarios', label: 'Usuários', Icon: UserCog },
  { href: '/login',          label: 'Sair',     Icon: LogOut },
]

interface Props {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

/** Logo AEE — folha estilizada SVG inline */
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

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: Props) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))

  const cls = [
    'nav',
    collapsed ? 'mini' : '',
    mobileOpen ? 'open' : '',
  ].filter(Boolean).join(' ')

  return (
    <>
      <div
        className={`nav-overlay${mobileOpen ? ' visible' : ''}`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      <aside className={cls} aria-label="Navegação principal">

        {/* Brand */}
        <div className="nav-brand">
          <div className="nav-logo">
            <Logo />
          </div>
          <div className="nav-wordmark">
            <span className="nav-name">Sistema AEE</span>
            <span className="nav-sub">Ed. Especializado</span>
          </div>
          <div style={{ flex: 1 }} />
          <button
            className="nav-toggle"
            onClick={onToggle}
            title={collapsed ? 'Expandir' : 'Recolher'}
          >
            {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
          <button
            onClick={onMobileClose}
            className="lg-hide"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 26, height: 26, borderRadius: 7,
              border: 'none', background: 'rgba(255,255,255,.1)',
              cursor: 'pointer', color: 'white',
            }}
            aria-label="Fechar menu"
          >
            <X size={13} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="nav-scroll">
          <p className="nav-section-label">Principal</p>

          {MAIN_NAV.map(({ href, label, Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={onMobileClose}
                className={`nav-item${active ? ' active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={16} className="nav-icon" />
                <span className="nav-label">{label}</span>
                <span className="nav-tooltip">{label}</span>
              </Link>
            )
          })}

          <div className="nav-divider" />
          <p className="nav-section-label">Sistema</p>

          {SYS_NAV.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              className={`nav-item${isActive(href) ? ' active' : ''}`}
            >
              <Icon size={16} className="nav-icon" />
              <span className="nav-label">{label}</span>
              <span className="nav-tooltip">{label}</span>
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="nav-footer">
          <div className="nav-user">
            <div className="nav-avatar">VP</div>
            <div className="nav-user-info">
              <p className="nav-user-name">Prof. Valdirene</p>
              <p className="nav-user-role">Professor AEE</p>
            </div>
          </div>
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
    toggle:      () => setCollapsed(c => !c),
    openMobile:  () => setMobileOpen(true),
    closeMobile: () => setMobileOpen(false),
  }
}
