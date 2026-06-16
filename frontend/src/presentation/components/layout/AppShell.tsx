'use client'

import React, { useEffect, useState } from 'react'
import { useSidebar, Sidebar } from './Sidebar'
import { Menu, Bell, RefreshCw, WifiOff, Check, AlertTriangle } from 'lucide-react'
import { usePendingCount } from '@/application/hooks/useAlunos'
import { useSync } from '@/application/hooks/useSync'
import { useOnlineStatus } from '@/application/hooks/useOnlineStatus'

interface AppShellProps {
  children: React.ReactNode
  title?: string
  actions?: React.ReactNode
  hideNav?: boolean
}

function SyncWidget() {
  const pendingCount = usePendingCount()
  const { state, runSync } = useSync()
  const isOnline = useOnlineStatus()
  const [justSynced, setJustSynced] = useState(false)

  useEffect(() => {
    if (state === 'idle' && pendingCount === 0 && !isOnline) return
  }, [state, pendingCount, isOnline])

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
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 border border-red-200 text-red-700">
          <WifiOff size={14} />
          <span>Sem conexão</span>
        </div>
      </div>
    )
  }

  // ── Sincronizando ────────────────────────────────────────
  if (state === 'syncing') {
    return (
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700">
          <RefreshCw size={14} className="animate-spin" />
          <span>Sincronizando...</span>
        </div>
      </div>
    )
  }

  // ── Erro de sync ─────────────────────────────────────────
  if (state === 'error') {
    return (
      <div className="flex items-center gap-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800">
          <AlertTriangle size={14} />
          <span>Falha na sincronização</span>
        </div>
        <button
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          onClick={() => runSync()}
          title="Tentar novamente"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    )
  }

  // ── Pendências (online + itens na fila) ──────────────────
  if (pendingCount > 0) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800">
          <AlertTriangle size={14} />
          <span>
            {pendingCount} {pendingCount === 1 ? 'registro pendente' : 'registros pendentes'}
          </span>
        </div>
        <button
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => runSync()}
          title="Sincronizar agora"
        >
          <RefreshCw size={14} />
        </button>
      </div>
    )
  }

  // ── Acabou de sincronizar (confirmação temporária) ────────
  if (justSynced) {
    return (
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700">
          <Check size={14} />
          <span>Tudo sincronizado</span>
        </div>
      </div>
    )
  }

  // ── Estado normal: tudo ok, online, sem pendências ────────
  return (
    <div className="flex items-center" title="Sistema online e sincronizado">
      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_0_2px_#dcfce7]" aria-label="Sistema sincronizado" />
    </div>
  )
}

export function AppShell({ children, title, actions, hideNav }: AppShellProps) {
  const { collapsed, mobileOpen, toggle, openMobile, closeMobile } = useSidebar()

  const spacerClass = collapsed ? 'w-[68px]' : 'w-[252px]'

  return (
    <div className="flex min-h-screen">
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
          className={`shrink-0 transition-all duration-200 hidden lg:block ${spacerClass}`}
          aria-hidden="true"
        />
      )}

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 gap-3 z-30 shadow-sm">
          {!hideNav && (
            <button
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              onClick={openMobile}
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
          )}

          <h1 className="flex-1 text-base font-bold text-slate-900 tracking-tight">{title ?? 'Sistema AEE'}</h1>

          <div className="flex items-center gap-3">
            <SyncWidget />

            <button className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors" aria-label="Notificações">
              <Bell size={18} />
              <span className="absolute top-[7px] right-[7px] w-2 h-2 rounded-full bg-red-500 border-2 border-white" aria-hidden="true" />
            </button>

            {actions}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden fade-up">
          {children}
        </main>
      </div>
    </div>
  )
}
