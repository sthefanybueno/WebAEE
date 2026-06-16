'use client'

/**
 * AppShell — Layout principal com lógica de Sync inteligente.
 *
 * Lógica do Sync Widget (UX por estado):
 *
 * ┌──────────────────────────────────────────────────────┐
 * │ Estado          │ O que aparece na topbar             │
 * ├──────────────────────────────────────────────────────┤
 * │ online + 0 pend.│ Ponto verde discreto (8px)          │
 * │ online + N pend.│ Badge âmbar "N pendentes" + btn sync│
 * │ offline         │ Badge vermelho "Sem conexão"         │
 * │ syncing         │ Badge azul "Sincronizando..." spinner│
 * │ error           │ Badge âmbar "Falha — tentar de novo" │
 * │ done (2s)       │ Badge verde "Tudo sincronizado ✓"    │
 * └──────────────────────────────────────────────────────┘
 *
 * Auto-sync: useSync.ts já ouve window.addEventListener('online')
 * e dispara runSync() automaticamente. Aqui apenas expomos UI.
 */

import React, { useEffect, useState } from 'react'
import { useSidebar, Sidebar } from './Sidebar'
import { Menu, Bell, RefreshCw, Wifi, WifiOff, Check } from 'lucide-react'
import { usePendingCount } from '@/application/hooks/useAlunos'
import { useSync } from '@/application/hooks/useSync'
import { useOnlineStatus } from '@/application/hooks/useOnlineStatus'

interface AppShellProps {
  children: React.ReactNode
  title?: string
  actions?: React.ReactNode
  hideNav?: boolean
}

/** Widget de sincronização — invisível quando tudo está bem */
function SyncWidget() {
  const pendingCount = usePendingCount()
  const { state, runSync } = useSync()
  const isOnline = useOnlineStatus()

  // Estado "done" — exibe confirmação por 2 segundos após sync bem-sucedido
  const [justSynced, setJustSynced] = useState(false)

  useEffect(() => {
    if (state === 'idle' && pendingCount === 0 && !isOnline) return
    if (state === 'idle' && pendingCount === 0) {
      // Evita piscar "tudo sincronizado" na inicialização
      // Só mostra se havia algo antes (controlado pelo justSynced)
    }
  }, [state, pendingCount, isOnline])

  // Detecta quando sync acabou com sucesso
  const prevState = React.useRef(state)
  useEffect(() => {
    if (prevState.current === 'syncing' && state === 'idle' && pendingCount === 0) {
      setJustSynced(true)
      const t = setTimeout(() => setJustSynced(false), 2500)
      return () => clearTimeout(t)
    }
    prevState.current = state
  }, [state, pendingCount])

  // ── Sem conexão ──────────────────────────────────────────
  if (!isOnline) {
    return (
      <div className="sync-widget">
        <div className="sync-badge offline">
          <WifiOff size={12} />
          <span>Sem conexão</span>
        </div>
      </div>
    )
  }

  // ── Sincronizando ────────────────────────────────────────
  if (state === 'syncing') {
    return (
      <div className="sync-widget">
        <div className="sync-badge syncing">
          <RefreshCw size={12} style={{ animation: 'spin .8s linear infinite' }} />
          <span>Sincronizando...</span>
        </div>
      </div>
    )
  }

  // ── Erro de sync ─────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="sync-widget">
        <div className="sync-badge warning">
          <span>⚠ Falha na sincronização</span>
        </div>
        <button
          className="sync-btn"
          onClick={() => runSync()}
          title="Tentar novamente"
        >
          <RefreshCw size={13} />
        </button>
      </div>
    )
  }

  // ── Pendências (online + itens na fila) ──────────────────
  if (pendingCount > 0) {
    return (
      <div className="sync-widget">
        <div className="sync-badge warning">
          <span>
            {pendingCount} {pendingCount === 1 ? 'registro pendente' : 'registros pendentes'}
          </span>
        </div>
        <button
          className="sync-btn"
          onClick={() => runSync()}
          title="Sincronizar agora"
        >
          <RefreshCw size={13} />
        </button>
      </div>
    )
  }

  // ── Acabou de sincronizar (confirmação temporária) ────────
  if (justSynced) {
    return (
      <div className="sync-widget">
        <div className="sync-badge success">
          <Check size={12} />
          <span>Tudo sincronizado</span>
        </div>
      </div>
    )
  }

  // ── Estado normal: tudo ok, online, sem pendências ────────
  // Apenas um pequeno ponto verde — não polui a tela
  return (
    <div className="sync-widget" title="Sistema online e sincronizado">
      <span className="sync-dot" aria-label="Sistema sincronizado" />
    </div>
  )
}

export function AppShell({ children, title, actions, hideNav }: AppShellProps) {
  const { collapsed, mobileOpen, toggle, openMobile, closeMobile } = useSidebar()

  return (
    <div className="shell">
      {!hideNav && (
        <Sidebar
          collapsed={collapsed}
          onToggle={toggle}
          mobileOpen={mobileOpen}
          onMobileClose={closeMobile}
        />
      )}

      {!hideNav && (
        <div
          className={`shell-spacer${collapsed ? ' mini' : ''}`}
          aria-hidden="true"
        />
      )}

      <div className="shell-body">
        {/* Topbar */}
        <header className="bar">
          {!hideNav && (
            <button
              className="bar-hamburger"
              onClick={openMobile}
              aria-label="Abrir menu"
            >
              <Menu size={19} />
            </button>
          )}

          <h1 className="bar-title">{title ?? 'Sistema AEE'}</h1>

          <div className="bar-actions">
            {/* Widget de sync — inteligente por estado */}
            <SyncWidget />

            {/* Notificações */}
            <button className="bar-bell" aria-label="Notificações">
              <Bell size={16} />
              <span className="bar-bell-dot" aria-hidden="true" />
            </button>

            {actions}
          </div>
        </header>

        {/* Content */}
        <main className="page fade-up">
          {children}
        </main>
      </div>
    </div>
  )
}
