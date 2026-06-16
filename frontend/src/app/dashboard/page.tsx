'use client'

import { AppShell } from '@/presentation/components/layout/AppShell'
import {
  Camera, AlertTriangle, Users, FileText, Clock,
  ArrowRight, BookOpen, CalendarDays, UserPlus, RefreshCw,
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
    { label: 'Alunos Ativos',       value: ativos, Icon: Users,    color: '#2563eb', bg: '#eff6ff', href: '/alunos' },
    { label: 'Relatórios Hoje',     value: 3,      Icon: FileText, color: '#7c3aed', bg: '#f5f3ff', href: '/relatorios' },
    { label: 'Atendimentos / Sem.', value: 12,     Icon: Clock,    color: '#d97706', bg: '#fffbeb', href: '/horarios' },
  ]

  const actions = [
    { href: '/relatorios',   Icon: BookOpen,    title: 'Relatório Diário',   desc: 'Registrar acompanhamentos do dia',   color: '#7c3aed', bg: '#f5f3ff' },
    { href: '/alunos',       Icon: Users,       title: 'Ver Alunos',         desc: 'Lista completa de estudantes',       color: '#2563eb', bg: '#eff6ff' },
    { href: '/horarios',     Icon: CalendarDays,title: 'Horários',           desc: 'Atendimentos desta semana',          color: '#d97706', bg: '#fffbeb' },
    { href: '/alunos/novo',  Icon: UserPlus,    title: 'Novo Aluno',         desc: 'Cadastrar estudante no sistema',     color: 'var(--g-700)', bg: 'var(--g-50)' },
  ]

  const feed = [
    { msg: 'Relatório salvo — Artur Mendes',  time: 'Agora',  dot: '#22c55e' },
    { msg: 'Aluno cadastrado localmente',      time: '10 min', dot: '#3b82f6' },
    { msg: 'Foto pedagógica registrada',       time: '32 min', dot: '#a855f7' },
    { msg: 'Sincronização concluída',          time: '1h',     dot: '#94a3b8' },
  ]

  return (
    <AppShell title="Dashboard">
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '36px 24px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.025em', color: 'var(--s-900)', lineHeight: 1.2 }}>
              Bom dia 👋
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-sub)', marginTop: 6 }}>{saudacao}</p>
          </div>
          <Link href="/momentos/registrar" className="btn btn-primary">
            <Camera size={15} />
            Registrar Momento
          </Link>
        </div>

        {/* ── Stats ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map(({ label, value, Icon, color, bg, href }) => (
            <Link key={label} href={href} className="card card-active-hover" style={{ textDecoration: 'none', display: 'block' }}>
              <div style={{ padding: '22px 24px' }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={18} color={color} />
                </div>
                <p style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.04em', color: 'var(--s-900)', lineHeight: 1 }}>
                  {value}
                </p>
                <p style={{ fontSize: 13, color: 'var(--color-sub)', marginTop: 5, fontWeight: 500 }}>
                  {label}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Body ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

          {/* Ações rápidas */}
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--s-900)', marginBottom: 14, letterSpacing: '-.01em' }}>
              Ações Rápidas
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {actions.map(({ href, Icon, title, desc, color, bg }) => (
                <Link key={href} href={href} className="card card-hover" style={{ textDecoration: 'none', display: 'block' }}>
                  <div className="flex items-center gap-4" style={{ padding: '15px 18px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={17} color={color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--s-900)' }}>{title}</p>
                      <p style={{ fontSize: 12, color: 'var(--color-sub)', marginTop: 2 }}>{desc}</p>
                    </div>
                    <ArrowRight size={14} color="var(--s-300)" style={{ flexShrink: 0 }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Coluna direita */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Feed de atividade */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--s-900)', marginBottom: 14, letterSpacing: '-.01em' }}>
                Atividade Recente
              </p>
              <div className="card" style={{ overflow: 'hidden' }}>
                {feed.map(({ msg, time, dot }, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3"
                    style={{
                      padding: '13px 18px',
                      borderBottom: i < feed.length - 1 ? '1px solid var(--color-border-s)' : 'none',
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0, boxShadow: `0 0 0 3px ${dot}25` }} />
                    <p style={{ flex: 1, fontSize: 13, color: 'var(--s-700)', lineHeight: 1.4 }}>{msg}</p>
                    <span style={{ fontSize: 11.5, color: 'var(--color-faint)', flexShrink: 0, fontWeight: 500 }}>{time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerta relatórios */}
            <div style={{ background: 'var(--r-50)', border: '1px solid var(--r-100)', borderRadius: 20, padding: '16px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--r-100)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={15} color="var(--r-600)" />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#991b1b', marginBottom: 4 }}>
                  8 relatórios pedagógicos pendentes
                </p>
                <Link href="/relatorios" className="inline-flex items-center gap-1" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--r-600)', textDecoration: 'none' }}>
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
