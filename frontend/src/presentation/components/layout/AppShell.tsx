'use client'

import { useSidebar, Sidebar } from './Sidebar'
import { OfflineBanner } from './OfflineBanner'
import { Menu, Bell, RefreshCcw } from 'lucide-react'
import { usePendingCount } from '@/application/hooks/useAlunos'
import { useSync } from '@/application/hooks/useSync'

type UserRole = 'prof_aee' | 'coordenacao' | 'prof_apoio' | 'prof_regente'

interface AppShellProps {
  children: React.ReactNode
  title?: string
  actions?: React.ReactNode
  role?: UserRole
  header?: React.ReactNode
  hideNav?: boolean
}

export function AppShell({ children, title, actions, header, hideNav }: AppShellProps) {
  const { collapsed, mobileOpen, toggle, openMobile, closeMobile } = useSidebar()
  const pendingCount = usePendingCount()
  const { state, runSync } = useSync()

  return (
    <div className="shell-root">
      {/* Sidebar */}
      {!hideNav && (
        <Sidebar
          collapsed={collapsed}
          onToggle={toggle}
          mobileOpen={mobileOpen}
          onMobileClose={closeMobile}
        />
      )}

      {/* Spacer that shifts content right on desktop */}
      {!hideNav && (
        <div className={`shell-spacer${collapsed ? ' collapsed' : ''}`} aria-hidden="true" />
      )}

      {/* Main content column */}
      <div className="shell-content">

        {/* Top bar */}
        <header className="topbar">
          {header ? (
            header
          ) : (
            <>
              {!hideNav && (
                <button
                  className="topbar-hamburger"
                  onClick={openMobile}
                  aria-label="Abrir menu"
                >
                  <Menu size={20} />
                </button>
              )}

              <h1 className="topbar-title">{title || 'Sistema AEE'}</h1>

              <div className="topbar-actions">
                {pendingCount > 0 && (
                  <button
                    onClick={() => runSync()}
                    disabled={state === 'syncing'}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 8,
                      background: '#FFFBEB', border: '1px solid #FDE68A',
                      color: '#92400E', fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    title={`${pendingCount} itens aguardando sincronizaÃ§Ã£o`}
                  >
                    <RefreshCcw
                      size={13}
                      style={{ animation: state === 'syncing' ? 'spin 1s linear infinite' : 'none' }}
                    />
                    <span>{pendingCount} pendente{pendingCount > 1 ? 's' : ''}</span>
                  </button>
                )}

                <button
                  aria-label="NotificaÃ§Ãµes"
                  style={{
                    position: 'relative', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', width: 36, height: 36,
                    borderRadius: 8, border: 'none', background: 'transparent',
                    cursor: 'pointer', color: 'var(--color-text-secondary)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-gray-100)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Bell size={18} />
                  <span style={{
                    position: 'absolute', top: 7, right: 7,
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#E53E3E', border: '2px solid white',
                  }} />
                </button>

                {actions}
              </div>
            </>
          )}
        </header>

        {/* Offline banner */}
        <OfflineBanner />

        {/* Page content */}
        <main className="page-main">
          {children}
        </main>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        /* hide mobile close button on desktop */
        @media (min-width: 1024px) {
          .lg-hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}

