'use client'

import { AppShell } from '@/presentation/components/layout/AppShell'
import {
  Camera, AlertTriangle, Users, FileText, Clock,
  ArrowRight, BookOpen, CalendarDays, UserPlus
} from 'lucide-react'
import Link from 'next/link'
import { useAlunos } from '@/application/hooks/useAlunos'
import { useSync } from '@/application/hooks/useSync'

export default function DashboardPage() {
  const { state, runSync } = useSync()
  const { alunos } = useAlunos()

  const ativos   = alunos?.filter(a => a.status === 'ativo').length  ?? 0
  const hoje     = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const saudacao = hoje.charAt(0).toUpperCase() + hoje.slice(1)

  const stats = [
    { label: 'Alunos Ativos',      value: ativos, Icon: Users,    color: '#2563eb', bg: '#eff6ff', href: '/alunos' },
    { label: 'Relatórios Hoje',    value: 3,      Icon: FileText, color: '#7c3aed', bg: '#f5f3ff', href: '/relatorios' },
    { label: 'Atendimentos / Sem.', value: 12,     Icon: Clock,    color: '#d97706', bg: '#fffbeb', href: '/horarios' },
  ]

  const actions = [
    { href: '/relatorios',   Icon: BookOpen,    title: 'Relatório Diário',   desc: 'Registrar acompanhamentos do dia',   color: '#7c3aed', bg: '#f5f3ff' },
    { href: '/alunos',       Icon: Users,       title: 'Ver Alunos',         desc: 'Lista completa de estudantes',       color: '#2563eb', bg: '#eff6ff' },
    { href: '/horarios',     Icon: CalendarDays,title: 'Horários',           desc: 'Atendimentos desta semana',          color: '#d97706', bg: '#fffbeb' },
    { href: '/alunos/novo',  Icon: UserPlus,    title: 'Novo Aluno',         desc: 'Cadastrar estudante no sistema',     color: '#4b5563', bg: '#f3f4f6' }, // Cores corrigidas
  ]

  const feed = [
    { msg: 'Relatório salvo — Artur Mendes',  time: 'Agora',  dot: '#22c55e' },
    { msg: 'Aluno cadastrado localmente',      time: '10 min', dot: '#3b82f6' },
    { msg: 'Foto pedagógica registrada',       time: '32 min', dot: '#a855f7' },
    { msg: 'Sincronização concluída',          time: '1h',     dot: '#94a3b8' },
  ]

  return (
    <AppShell title="Dashboard">
      <div className="max-w-[1160px] mx-auto px-6 py-9 flex flex-col gap-8">

        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Bom dia 👋
            </h2>
            <p className="text-sm text-gray-500 mt-1.5">{saudacao}</p>
          </div>
          <Link 
            href="/momentos/registrar" 
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            <Camera size={15} />
            Registrar Momento
          </Link>
        </div>

        {/* ── Stats ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map(({ label, value, Icon, color, bg, href }) => (
            <Link 
              key={label} 
              href={href} 
              className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 block hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all duration-200"
            >
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" 
                style={{ backgroundColor: bg }}
              >
                <Icon size={18} color={color} />
              </div>
              <p className="text-3xl font-extrabold tracking-tighter text-gray-900 leading-none">
                {value}
              </p>
              <p className="text-sm font-medium text-gray-500 mt-1">
                {label}
              </p>
            </Link>
          ))}
        </div>

        {/* ── Body ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

          {/* Ações rápidas */}
          <div>
            <p className="text-sm font-bold text-gray-900 mb-3 tracking-tight">
              Ações Rápidas
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {actions.map(({ href, Icon, title, desc, color, bg }) => (
                <Link 
                  key={href} 
                  href={href} 
                  className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex items-center gap-4 hover:shadow-md hover:border-gray-300 transition-all duration-200"
                >
                  <div 
                    className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center" 
                    style={{ backgroundColor: bg }}
                  >
                    <Icon size={17} color={color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{desc}</p>
                  </div>
                  <ArrowRight size={14} className="text-gray-300 shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* Coluna direita */}
          <div className="flex flex-col gap-4">

            {/* Feed de atividade */}
            <div>
              <p className="text-sm font-bold text-gray-900 mb-3 tracking-tight">
                Atividade Recente
              </p>
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {feed.map(({ msg, time, dot }, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <span 
                      className="w-2 h-2 rounded-full shrink-0" 
                      style={{ backgroundColor: dot, boxShadow: `0 0 0 3px ${dot}25` }} 
                    />
                    <p className="flex-1 text-sm text-gray-700 leading-snug truncate">{msg}</p>
                    <span className="text-xs text-gray-400 shrink-0 font-medium">{time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerta relatórios */}
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-red-100 shrink-0 flex items-center justify-center">
                <AlertTriangle size={15} className="text-red-600" />
              </div>
              <div>
                <p className="font-bold text-sm text-red-800 mb-1">
                  8 relatórios pedagógicos pendentes
                </p>
                <Link 
                  href="/relatorios" 
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                >
                  Ver relatórios <ArrowRight size={11} />
                </Link>
              </div>
            </div>

          </div>
        </div>

      </div>
    </AppShell>
  )
}