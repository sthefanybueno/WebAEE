'use client'

import Link from 'next/link'
import { ArrowRight, BookOpen, School, Users } from 'lucide-react'
import { useAlunos } from '@/application/hooks/useAlunos'
import { useEscolas } from '@/application/hooks/useEscolas'
import { useUsuarios } from '@/application/hooks/useUsuarios'

export function DashboardAdminCoord() {
  const { alunos } = useAlunos()
  const { escolas } = useEscolas()
  const { total: totalUsuarios } = useUsuarios()

  const totalAtivos = alunos?.filter((a) => a.status === 'ativo').length ?? 0
  const totalEscolas = escolas?.length ?? 0

  const stats = [
    {
      label: 'Escolas',
      value: totalEscolas,
      Icon: School,
      color: '#2563eb',
      bg: '#eff6ff',
      href: '/escolas',
    },
    {
      label: 'Alunos Ativos',
      value: totalAtivos,
      Icon: Users,
      color: '#7c3aed',
      bg: '#f5f3ff',
      href: '/alunos',
    },
    {
      label: 'Usuários',
      value: totalUsuarios,
      Icon: BookOpen,
      color: '#d97706',
      href: '/admin/usuarios',
    },
  ]

  const atalhos = [
    { href: '/alunos/novo', label: 'Novo Aluno', Icon: Users, color: '#2563eb', bg: '#eff6ff' },
    { href: '/escolas', label: 'Ver Escolas', Icon: School, color: '#7c3aed', bg: '#f5f3ff' },
    { href: '/admin/usuarios', label: 'Gerenciar Usuários', Icon: BookOpen, color: '#d97706', bg: '#fffbeb' },
    { href: '/relatorios', label: 'Relatórios', Icon: BookOpen, color: '#4b5563', bg: '#f3f4f6' },
  ]

  return (
    <div className="max-w-[1160px] mx-auto px-6 py-9 flex flex-col gap-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Painel Administrativo</h2>
        <p className="text-sm text-gray-500 mt-1">Visão geral do sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, Icon, color, bg, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 block hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: bg }}>
              <Icon size={18} color={color} />
            </div>
            <p className="text-3xl font-extrabold tracking-tighter text-gray-900 leading-none">{value}</p>
            <p className="text-sm font-medium text-gray-500 mt-1">{label}</p>
          </Link>
        ))}
      </div>

      {/* Atalhos */}
      <div>
        <p className="text-sm font-bold text-gray-900 mb-3 tracking-tight">Ações Rápidas</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {atalhos.map(({ href, label, Icon, color, bg }) => (
            <Link
              key={href}
              href={href}
              className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex items-center gap-4 hover:shadow-md hover:border-gray-300 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center" style={{ backgroundColor: bg }}>
                <Icon size={17} color={color} />
              </div>
              <span className="flex-1 text-sm font-semibold text-gray-900">{label}</span>
              <ArrowRight size={14} className="text-gray-300 shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Atividades Recentes (Placeholder) */}
      <div>
        <p className="text-sm font-bold text-gray-900 mb-3 tracking-tight">Atividades Recentes</p>
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 text-center">
          <p className="text-sm text-gray-500">Nenhuma atividade recente encontrada.</p>
        </div>
      </div>
    </div>
  )
}
