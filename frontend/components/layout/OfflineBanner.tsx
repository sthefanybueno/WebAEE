'use client'

import { useEffect, useState } from 'react'
import { CloudOff } from 'lucide-react'

export function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    setOffline(!navigator.onLine)
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2"
    >
      <CloudOff size={14} className="text-amber-700 shrink-0" />
      <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">
        Offline — Alterações salvas localmente
      </p>
    </div>
  )
}
