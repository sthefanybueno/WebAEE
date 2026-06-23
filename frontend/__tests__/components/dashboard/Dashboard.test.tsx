import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { vi, describe, it, expect } from 'vitest'
import { DashboardAdminCoord } from '@/presentation/components/dashboard/DashboardAdminCoord'
import { DashboardAEE } from '@/presentation/components/dashboard/DashboardAEE'
import { DashboardApoioRegente } from '@/presentation/components/dashboard/DashboardApoioRegente'
import DashboardPage from '@/app/dashboard/page'
import { PapelUsuario } from '@/domain/entities/Usuario'

// Mock Hooks
vi.mock('@/application/hooks/useAlunos', () => ({
  useAlunos: vi.fn(() => ({ alunos: [] }))
}))
vi.mock('@/application/hooks/useEscolas', () => ({
  useEscolas: vi.fn(() => ({ escolas: [] }))
}))
vi.mock('@/application/hooks/usePapel', () => ({
  usePapel: vi.fn()
}))

// Mock AppShell to avoid full render issues
vi.mock('@/presentation/components/layout/AppShell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div data-testid="app-shell">{children}</div>
}))

describe('Dashboards Rendering based on Role', () => {

  it('renders Admin Dashboard correctly with required cards', () => {
    render(<DashboardAdminCoord />)
    
    // Admin Cards
    expect(screen.getByText('Escolas')).toBeInTheDocument()
    expect(screen.getByText('Alunos Ativos')).toBeInTheDocument()
    expect(screen.getByText('Usuários')).toBeInTheDocument()
    
    // Missing requirement added
    expect(screen.getByText('Atividades Recentes')).toBeInTheDocument()
  })

  it('renders AEE Dashboard correctly with required cards', () => {
    render(<DashboardAEE />)
    
    // AEE Cards
    expect(screen.getByText('Meus Alunos')).toBeInTheDocument()
    expect(screen.getAllByText('Relatórios')[0]).toBeInTheDocument()
    expect(screen.getAllByText('Minha Agenda')[0]).toBeInTheDocument()
    expect(screen.getByText('Escolas')).toBeInTheDocument()
    
    // Missing requirement added
    expect(screen.getByText('Atividades Recentes')).toBeInTheDocument()

    // Required button
    expect(screen.getByText('Registrar Momento')).toBeInTheDocument()
  })

  it('renders Apoio Dashboard correctly with required cards', () => {
    render(<DashboardApoioRegente />)
    
    // Apoio Cards
    expect(screen.getByText('Relatórios')).toBeInTheDocument()
    
    // Required button
    expect(screen.getByText('Registrar Momento Pedagógico')).toBeInTheDocument()
  })

})
