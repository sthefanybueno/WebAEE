'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSidebar, Sidebar } from './Sidebar'
import { Bell, Menu, RefreshCw, WifiOff, Check, AlertTriangle } from 'lucide-react'
import { usePendingCount } from '@/application/hooks/useAlunos'
import { useSync } from '@/application/hooks/useSync'
import { useOnlineStatus } from '@/application/hooks/useOnlineStatus'
import { useNotificacoes } from '@/application/hooks/useNotificacoes'

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
  
  const [toast, setToast] = useState<{ message: string, type: 'syncing' | 'success' | 'info', visible: boolean }>({ message: '', type: 'info', visible: false })
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (message: string, type: 'syncing' | 'success' | 'info', duration = 3000) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast({ message, type, visible: true })
    if (duration > 0) {
      toastTimeoutRef.current = setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }))
      }, duration)
    }
  }

  const prevState = React.useRef(state)
  useEffect(() => {
    if (prevState.current === 'syncing' && state === 'idle' && pendingCount === 0) {
      showToast('Sincronização concluída!', 'success', 3000)
    }
    prevState.current = state
  }, [state, pendingCount])

  // Lógica de cores baseada no estado
  const isPending = pendingCount > 0 || state === 'error'
  const colorClass = !isOnline 
    ? 'bg-red-500 shadow-[0_0_0_2px_#fee2e2]' 
    : isPending 
      ? 'bg-amber-500 shadow-[0_0_0_2px_#fef3c7]' 
      : 'bg-emerald-500 shadow-[0_0_0_2px_#dcfce7]'

  const statusTitle = !isOnline 
    ? 'Sistema Offline' 
    : isPending 
      ? `${pendingCount} registro(s) pendente(s)` 
      : 'Sistema Sincronizado'

  const handleSyncClick = () => {
    if (!isOnline) {
      showToast('Você está offline e não pode sincronizar.', 'info', 3000)
      return
    }
    if (pendingCount === 0 && state !== 'error') {
      showToast('O sistema já está sincronizado!', 'info', 3000)
    } else {
      showToast('Sincronizando dados...', 'syncing', 0) // Fica na tela até terminar
    }
    runSync()
  }

  return (
    <>
      <div className="flex items-center gap-2" title={statusTitle}>
        <span className={`w-2 h-2 rounded-full ${colorClass} ml-2 mr-1 transition-colors`} aria-label={statusTitle} />
        <button
          className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
            isPending 
              ? 'border-amber-200 text-amber-600 hover:bg-amber-50' 
              : 'border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
          onClick={handleSyncClick}
          disabled={state === 'syncing' || !isOnline}
          title={state === 'syncing' ? 'Sincronizando...' : 'Forçar sincronização'}
        >
          <RefreshCw size={14} className={state === 'syncing' ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Toast de Sincronização */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
            {toast.type === 'success' && (
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Check size={14} />
              </div>
            )}
            {toast.type === 'syncing' && (
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                <RefreshCw size={14} className="animate-spin" />
              </div>
            )}
            {toast.type === 'info' && (
              <div className="w-6 h-6 rounded-full bg-slate-500/20 flex items-center justify-center text-slate-400">
                <Check size={14} />
              </div>
            )}
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}
    </>
  )
}

export function AppShell({ children, title, actions, hideNav }: AppShellProps) {
  const { collapsed, mobileOpen, toggle, openMobile, closeMobile } = useSidebar()
  const { notificacoes, naoLidas, marcarComoLida, marcarTodasComoLidas } = useNotificacoes()
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef<HTMLDivElement>(null)

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

            {/* Botão de Notificações */}
            <div ref={bellRef} className="relative">
              <button
                id="btn-notificacoes"
                className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                aria-label="Notificações"
                onClick={() => setBellOpen((v) => !v)}
              >
                <Bell size={18} />
                {naoLidas > 0 && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 border-2 border-white text-white text-[10px] font-bold flex items-center justify-center px-1"
                    aria-label={`${naoLidas} notificações não lidas`}
                  >
                    {naoLidas > 9 ? '9+' : naoLidas}
                  </span>
                )}
              </button>

              {/* Dropdown de notificações */}
              {bellOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <span className="text-sm font-bold text-slate-900">Notificações</span>
                    {naoLidas > 0 && (
                      <button
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        onClick={marcarTodasComoLidas}
                      >
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    {notificacoes.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-slate-400 text-center">
                        Nenhuma notificação
                      </div>
                    ) : (
                      notificacoes.slice(0, 20).map((n) => (
                        <button
                          key={n.id}
                          className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3 items-start ${!n.lida ? 'bg-blue-50/40' : ''}`}
                          onClick={() => marcarComoLida(n.id)}
                        >
                          <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.lida ? 'bg-slate-300' : 'bg-blue-500'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 leading-snug">{n.mensagem}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {new Date(n.createdAt).toLocaleString('pt-BR', {
                                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
