'use client'

import { useEffect, useState } from 'react'

/**
 * useOnlineStatus — detecta estado de conexão de forma reativa.
 *
 * Ouve `window.online` e `window.offline` e retorna o estado atual.
 * SSR-safe: inicializa como `true` no servidor (navegador não existe).
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Lê o estado real assim que o componente monta no client
    setIsOnline(navigator.onLine)

    const handleOnline  = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
