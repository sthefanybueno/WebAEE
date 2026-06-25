'use client'

import Link from 'next/link'
import { ArrowRight, BookOpen, CalendarDays, Camera, FileText, School, Users } from 'lucide-react'
import { useAlunos } from '@/application/hooks/useAlunos'
import { useEscolas } from '@/application/hooks/useEscolas'
import { useDashboard } from '@/application/hooks/useDashboard'
import { useAgendas } from '@/application/hooks/useAgendas'
import { usePapel } from '@/application/hooks/usePapel'

export function DashboardAEE() {
  const { alunos } = useAlunos()
  const { escolas } = useEscolas()
  const { stats } = useDashboard()
  const { agendas } = useAgendas()
  const dadosUsuario = usePapel()

  const meusAlunos = alunos?.filter((a) => a.status === 'ativo').length ?? 0
  const totalEscolas = escolas?.length ?? 0
  const totalRelatorios = stats?.total_relatorios_pendentes ?? 0
  const totalAgendas = agendas?.length ?? 0

  return (
    <div className="max-w-[1160px] mx-auto px-6 py-9 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Olá, AEE {dadosUsuario?.nome?.split(' ')[0] } </h2>
          <p className="text-sm text-gray-500 mt-1">Acompanhe seus atendimentos</p>
        </div>
        <Link
          href="/momentos/registrar"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <Camera size={15} />
          Registrar Momento
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Meus Alunos', value: meusAlunos, Icon: Users, color: '#2563eb', bg: '#eff6ff', href: '/alunos' },
          { label: 'Relatórios', value: totalRelatorios, Icon: FileText, color: '#7c3aed', bg: '#f5f3ff', href: '/relatorios' },
          { label: 'Minha Agenda', value: totalAgendas, Icon: CalendarDays, color: '#d97706', bg: '#fffbeb', href: '/horarios' },
          { label: 'Escolas', value: totalEscolas, Icon: School, color: '#059669', bg: '#ecfdf5', href: '/escolas' },
        ].map(({ label, value, Icon, color, bg, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 block hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: bg }}>
              <Icon size={16} color={color} />
            </div>
            <p className="text-2xl font-extrabold tracking-tighter text-gray-900 leading-none">{value}</p>
            <p className="text-xs font-medium text-gray-500 mt-1">{label}</p>
          </Link>
        ))}
      </div>

      {/* Atalhos */}
      <div>
        <p className="text-sm font-bold text-gray-900 mb-3">Ações Rápidas</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { href: '/relatorios/novo', label: 'Novo Relatório', Icon: BookOpen, color: '#7c3aed', bg: '#f5f3ff' },
            { href: '/alunos/novo', label: 'Cadastrar Aluno', Icon: Users, color: '#2563eb', bg: '#eff6ff' },
            { href: '/horarios', label: 'Minha Agenda', Icon: CalendarDays, color: '#d97706', bg: '#fffbeb' },
            { href: '/momentos/registrar', label: 'Registrar Momento', Icon: Camera, color: '#4b5563', bg: '#f3f4f6' },
          ].map(({ href, label, Icon, color, bg }) => (
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
