'use client'

import { AppShell } from '@/presentation/components/layout/AppShell'
import { usePapel } from '@/application/hooks/usePapel'
import { PapelUsuario } from '@/domain/entities/Usuario'
import { DashboardAdminCoord } from '@/presentation/components/dashboard/DashboardAdminCoord'
import { DashboardAEE } from '@/presentation/components/dashboard/DashboardAEE'
import { DashboardApoioRegente } from '@/presentation/components/dashboard/DashboardApoioRegente'

export default function DashboardPage() {
  const usuario = usePapel()

  function renderDashboard() {
    if (!usuario) {
      return (
        <div className="flex items-center justify-center h-48">
          <span className="text-sm text-gray-400">Carregando...</span>
        </div>
      )
    }

    switch (usuario.papel) {
      case PapelUsuario.ADMIN:
      case PapelUsuario.COORDENACAO:
        return <DashboardAdminCoord />

      case PapelUsuario.PROF_AEE:
        return <DashboardAEE />

      case PapelUsuario.PROF_APOIO:
      case PapelUsuario.PROF_REGENTE:
        return <DashboardApoioRegente />

      default:
        return <DashboardAdminCoord />
    }
  }

  return (
    <AppShell title="Dashboard">
      {renderDashboard()}
    </AppShell>
  )
}