'use client'

import { AppShell } from '@/components/layout/AppShell'
import { Camera, AlertTriangle, RefreshCcw, Users, FileText, Clock, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { usePendingCount, useAlunos } from '@/hooks/useAlunos'
import { useSync } from '@/hooks/useSync'

export default function DashboardPage() {
  const pendingCount = usePendingCount()
  const { state, runSync } = useSync()
  const { alunos } = useAlunos()

  const alunosAtivos = alunos?.filter(a => a.status === 'ativo').length ?? 0

  const stats = [
    { label: 'Alunos Ativos', value: alunosAtivos, icon: Users, color: '#2563EB', bg: '#EFF6FF', href: '/alunos' },
    { label: 'Relatórios Hoje', value: 3, icon: FileText, color: '#7C3AED', bg: '#F5F3FF', href: '/relatorios' },
    { label: 'Atendimentos / Semana', value: 12, icon: Clock, color: '#D97706', bg: '#FFFBEB', href: '/horarios' },
    { label: 'Pendentes Offline', value: pendingCount, icon: RefreshCcw, color: '#DC6803', bg: '#FFF7ED', href: '#' },
  ]

  const quickActions = [
    { href: '/relatorios', icon: '📋', title: 'Relatório Diário', desc: 'Registrar os acompanhamentos do dia' },
    { href: '/alunos', icon: '👥', title: 'Ver Alunos', desc: 'Lista completa de estudantes' },
    { href: '/horarios', icon: '📅', title: 'Grade de Horários', desc: 'Atendimentos desta semana' },
    { href: '/alunos/novo', icon: '➕', title: 'Novo Aluno', desc: 'Cadastrar estudante no sistema' },
  ]

  const activity = [
    { msg: 'Relatório salvo — Artur Mendes', time: 'Agora', dot: '#22c55e' },
    { msg: 'Aluno cadastrado localmente', time: '10 min', dot: '#3b82f6' },
    { msg: 'Foto pedagógica registrada', time: '32 min', dot: '#a855f7' },
    { msg: 'Sincronização concluída', time: '1h', dot: '#d1d5db' },
  ]

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayCap = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <AppShell title="Dashboard">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Bom dia, Professora Valdirene 👋
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginTop: 3 }}>{todayCap}</p>
          </div>
          <Link href="/momentos/registrar" className="btn-primary">
            <Camera size={16} />
            Registrar Momento
          </Link>
        </div>

        {/* ── Sync Alert ── */}
        {pendingCount > 0 && (
          <div className="sync-alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCcw size={17} color="#D97706" style={{ animation: state === 'syncing' ? 'spin 1s linear infinite' : 'none' }} />
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13.5, color: '#78350F' }}>
                  {pendingCount} alteração{pendingCount > 1 ? 'ões' : ''} aguardando sincronização
                </p>
                <p style={{ fontSize: 12, color: '#92400E', marginTop: 1 }}>
                  Dados salvos localmente — serão enviados ao servidor assim que houver conexão.
                </p>
              </div>
            </div>
            <button
              onClick={() => runSync()}
              disabled={state === 'syncing'}
              className="btn-primary"
              style={{ flexShrink: 0, padding: '7px 16px', fontSize: 13 }}
            >
              {state === 'syncing' ? 'Sincronizando...' : 'Sincronizar agora'}
            </button>
          </div>
        )}

        {/* ── Stats Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {stats.map(({ label, value, icon: Icon, color, bg, href }) => (
            <Link
              key={label}
              href={href}
              className="card card-hover"
              style={{ padding: '20px 20px 18px', textDecoration: 'none', display: 'block', transition: 'all 0.15s' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon size={19} color={color} />
              </div>
              <p style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', marginTop: 5 }}>{label}</p>
            </Link>
          ))}
        </div>

        {/* ── Main Grid: Quick Actions + Activity ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

          {/* Quick Actions */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 14 }}>Ações Rápidas</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {quickActions.map(({ href, icon, title, desc }) => (
                <Link
                  key={href}
                  href={href}
                  className="card card-hover"
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '16px 16px', textDecoration: 'none', transition: 'all 0.15s' }}
                >
                  <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-primary)' }}>{title}</p>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{desc}</p>
                  </div>
                  <ArrowRight size={14} color="var(--c-gray-400)" style={{ marginLeft: 'auto', flexShrink: 0, marginTop: 3 }} />
                </Link>
              ))}
            </div>
          </div>

          {/* Activity + Alerts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Activity */}
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 14 }}>Atividade Recente</h3>
              <div className="card" style={{ overflow: 'hidden' }}>
                {activity.map(({ msg, time, dot }, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 16px',
                      borderBottom: i < activity.length - 1 ? '1px solid var(--c-gray-100)' : 'none',
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                    <p style={{ flex: 1, fontSize: 13, color: 'var(--color-text-primary)' }}>{msg}</p>
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', flexShrink: 0 }}>{time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending alert */}
            {pendingCount === 0 && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA',
                borderRadius: 12, padding: '14px 16px',
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13, color: '#991B1B' }}>8 relatórios pendentes</p>
                  <Link href="/relatorios" style={{ fontSize: 12, color: '#DC2626', textDecoration: 'underline' }}>
                    Acessar Relatórios →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </AppShell>
  )
}
