'use client'

import { useState } from 'react'
import { AppShell } from '@/presentation/components/layout/AppShell'
import { Search, Plus, Loader2, AlertCircle, CheckCircle2, Clock, Users } from 'lucide-react'
import Link from 'next/link'
import { getInitials } from '@/presentation/utils/utils'
import { useAlunos } from '@/application/hooks/useAlunos'

type Filtro = 'todos' | 'local' | 'synced'

const FILTROS: { value: Filtro; label: string }[] = [
  { value: 'todos',  label: 'Todos'          },
  { value: 'local',  label: 'Pendentes'      },
  { value: 'synced', label: 'Sincronizados'  },
]

export default function AlunosPage() {
  const [busca,  setBusca]  = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const { alunos, loading } = useAlunos(undefined, busca, filtro)

  return (
    <AppShell title="Alunos">
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '36px 24px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.025em', color: 'var(--s-900)', lineHeight: 1.2 }}>
              Alunos
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--color-sub)', marginTop: 5 }}>
              {loading
                ? 'Carregando...'
                : `${alunos.length} aluno${alunos.length !== 1 ? 's' : ''} encontrado${alunos.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>

          <Link href="/alunos/novo" className="btn btn-primary">
            <Plus size={15} />
            Novo Aluno
          </Link>
        </div>

        {/* ── Barra de busca + filtros ─────────────────────── */}
        <div className="flex gap-3 flex-wrap items-center">
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search
              size={14}
              style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--s-400)', pointerEvents: 'none' }}
            />
            <input
              type="search"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar pelo nome..."
              className="input"
              style={{ paddingLeft: 38 }}
            />
            {loading && (
              <Loader2
                size={13}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--g-700)', animation: 'spin 1s linear infinite' }}
              />
            )}
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            {FILTROS.map(f => (
              <button
                key={f.value}
                onClick={() => setFiltro(f.value)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--r-full)',
                  fontSize: 13,
                  fontWeight: 600,
                  border: filtro === f.value ? '1px solid var(--g-200)' : '1px solid var(--color-border)',
                  background: filtro === f.value ? 'var(--g-50)' : 'transparent',
                  color: filtro === f.value ? 'var(--g-700)' : 'var(--color-sub)',
                  cursor: 'pointer',
                  transition: 'all .14s',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Conteúdo ─────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center" style={{ padding: '80px 0', gap: 14 }}>
            <Loader2 size={26} style={{ color: 'var(--g-700)', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 13.5, color: 'var(--color-sub)', fontWeight: 500 }}>Carregando alunos...</p>
          </div>

        ) : alunos.length === 0 ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--s-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <Users size={24} color="var(--s-400)" />
            </div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--s-900)' }}>Nenhum aluno encontrado</p>
            <p style={{ fontSize: 13.5, color: 'var(--color-sub)', marginTop: 6, marginBottom: 24, maxWidth: 300 }}>
              {busca ? 'Tente outros termos de busca ou ajuste os filtros.' : 'Cadastre o primeiro aluno para começar.'}
            </p>
            <Link href="/alunos/novo" className="btn btn-primary" style={{ fontSize: 13 }}>
              <Plus size={14} /> Cadastrar Aluno
            </Link>
          </div>

        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Escola</th>
                  <th>Nascimento</th>
                  <th>Status</th>
                  <th>Sincronização</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {alunos.map(a => (
                  <tr key={a.server_id ?? a.id}>

                    {/* Nome */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          background: 'var(--g-100)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--g-700)', fontSize: 11.5, fontWeight: 700, letterSpacing: '.03em',
                        }}>
                          {getInitials(a.nome)}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{a.nome}</span>
                      </div>
                    </td>

                    {/* Escola */}
                    <td style={{ color: 'var(--color-sub)', fontSize: 13 }}>
                      {a.escola_atual || '—'}
                    </td>

                    {/* Nascimento */}
                    <td style={{ color: 'var(--color-sub)', fontSize: 13 }}>
                      {a.data_nascimento
                        ? new Date(a.data_nascimento).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`badge ${a.status === 'ativo' ? 'b-green' : 'b-slate'}`}>
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: a.status === 'ativo' ? '#16a34a' : 'var(--s-400)',
                          flexShrink: 0,
                          ...(a.status === 'ativo' ? { animation: 'glow-pulse 2s ease infinite' } : {}),
                        }} />
                        {a.status === 'ativo' ? 'Ativo' : 'Arquivado'}
                      </span>
                    </td>

                    {/* Sync */}
                    <td>
                      {a.sync_status === 'local' ? (
                        <span className="badge b-amber">
                          <Clock size={10} style={{ flexShrink: 0 }} />
                          Pendente
                        </span>
                      ) : a.sync_status === 'failed' ? (
                        <span className="badge b-red">
                          <AlertCircle size={10} style={{ flexShrink: 0 }} />
                          Falhou
                        </span>
                      ) : (
                        <span className="badge b-green">
                          <CheckCircle2 size={10} style={{ flexShrink: 0 }} />
                          Sincronizado
                        </span>
                      )}
                    </td>

                    {/* Ação */}
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/alunos/${a.server_id ?? a.id}`}
                        style={{
                          fontSize: 12.5, fontWeight: 600, color: 'var(--g-700)',
                          textDecoration: 'none', padding: '5px 12px',
                          borderRadius: 'var(--r-full)',
                          background: 'var(--g-50)',
                          border: '1px solid var(--g-200)',
                          display: 'inline-block',
                          transition: 'background .14s',
                        }}
                        onMouseEnter={e => ((e.target as HTMLElement).style.background = 'var(--g-100)')}
                        onMouseLeave={e => ((e.target as HTMLElement).style.background = 'var(--g-50)')}
                      >
                        Ver perfil →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  )
}
