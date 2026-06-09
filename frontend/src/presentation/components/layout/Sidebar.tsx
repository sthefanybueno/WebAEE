'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Users, FileText, Calendar, Camera,
  UserCog, LogOut, Leaf, ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react'

type UserRole = 'prof_aee' | 'coordenacao' | 'prof_apoio' | 'prof_regente'

const mainNav = [
  { href: '/dashboard',          label: 'Dashboard',         Icon: LayoutDashboard },
  { href: '/alunos',             label: 'Alunos',            Icon: Users },
  { href: '/relatorios',         label: 'Relatórios',        Icon: FileText },
  { href: '/horarios',           label: 'Horários',          Icon: Calendar },
  { href: '/momentos/registrar', label: 'Registrar Momento', Icon: Camera },
]

const systemNav = [
  { href: '/admin/usuarios', label: 'Usuários', Icon: UserCog },
  { href: '/login',          label: 'Sair',     Icon: LogOut },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))

  const sidebarClass = [
    'sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ')

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${mobileOpen ? ' open' : ''}`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      <aside className={sidebarClass} aria-label="Menu de navegação">

        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">
            <Leaf size={18} color="white" />
          </div>
          <span className="sidebar-brand-name">Sistema AEE</span>
          <div style={{ flex: 1 }} />
          {/* Desktop collapse */}
          <button
            className="sidebar-toggle"
            onClick={onToggle}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed
              ? <ChevronRight size={14} />
              : <ChevronLeft size={14} />
            }
          </button>
          {/* Mobile close */}
          <button
            onClick={onMobileClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 8, border: 'none',
              background: 'rgba(255,255,255,0.12)', cursor: 'pointer', color: 'white',
            }}
            className="lg-hidden"
            aria-label="Fechar menu"
          >
            <X size={14} />
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <p className="sidebar-label">Principal</p>

          {mainNav.map(({ href, label, Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={onMobileClose}
                className={`sidebar-link${active ? ' active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={17} className="sidebar-link-icon" />
                <span className="sidebar-link-label">{label}</span>
                <span className="sidebar-tooltip">{label}</span>
              </Link>
            )
          })}

          <div className="sidebar-divider" />
          <p className="sidebar-label">Sistema</p>

          {systemNav.map(({ href, label, Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={onMobileClose}
                className={`sidebar-link${active ? ' active' : ''}`}
              >
                <Icon size={17} className="sidebar-link-icon" />
                <span className="sidebar-link-label">{label}</span>
                <span className="sidebar-tooltip">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer user */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">VP</div>
            <div className="sidebar-user-info">
              <p className="sidebar-user-name">Prof. Valdirene</p>
              <p className="sidebar-user-role">Professor AEE</p>
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
    toggle: () => setCollapsed(c => !c),
    openMobile: () => setMobileOpen(true),
    closeMobile: () => setMobileOpen(false),
  }
}
