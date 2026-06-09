'use client'

import { useState } from 'react'
import { AppShell } from '@/presentation/components/layout/AppShell'
import { Search, Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { getInitials } from '@/presentation/utils/utils'
import { useAlunos } from '@/application/hooks/useAlunos'

type FilterType = 'todos' | 'pendente' | 'feito'

export default function AlunosPage() {
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<FilterType>('todos')

  // âœ… Toda lÃ³gica de filtro delegada ao Hook (Controller/Adapter)
  // O componente nÃ£o sabe o que significa 'pending' ou como filtrar â€” apenas passa parÃ¢metros.
  const { alunos, loading } = useAlunos(undefined, busca, filtro)

  return (
    <AppShell title="GestÃ£o de Alunos">
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>Alunos</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginTop: 3 }}>
              {loading ? 'Carregando...' : `${alunos.length} aluno${alunos.length !== 1 ? 's' : ''} encontrado${alunos.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Link href="/alunos/novo" className="btn-primary">
            <Plus size={16} />
            Novo Aluno
          </Link>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={15} color="var(--c-gray-400)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              type="search"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar pelo nome do aluno..."
              className="form-input"
              style={{ paddingLeft: 36 }}
            />
            {loading && (
              <Loader2 size={14} color="var(--c-green-700)" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', animation: 'spin 1s linear infinite' }} />
            )}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 6 }}>
            {(['todos', 'pendente', 'feito'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                  border: filtro === f ? '1px solid #1A6F45' : '1px solid var(--color-border)',
                  background: filtro === f ? '#1A6F45' : 'white',
                  color: filtro === f ? 'white' : 'var(--color-text-secondary)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {f === 'todos' ? 'Todos' : f === 'pendente' ? 'âš  Pendentes' : 'âœ“ Sincronizados'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <Loader2 size={28} color="#1A6F45" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : alunos.length === 0 ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>ðŸ”</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>Nenhum aluno encontrado</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 6, marginBottom: 20 }}>
              Tente ajustar os filtros ou a busca
            </p>
            <Link href="/alunos/novo" className="btn-primary" style={{ fontSize: 13 }}>
              <Plus size={14} /> Cadastrar Aluno
            </Link>
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Escola</th>
                  <th>Nascimento</th>
                  <th>Status</th>
                  <th>SincronizaÃ§Ã£o</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {alunos.map((aluno) => (
                  <tr key={aluno.server_id || aluno.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: '#D1F0E0', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          color: '#1A6F45', fontWeight: 700, fontSize: 12, flexShrink: 0,
                        }}>
                          {getInitials(aluno.nome)}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{aluno.nome}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>{aluno.escola_atual || 'â€”'}</td>
                    <td style={{ color: 'var(--color-text-secondary)' }}>
                      {aluno.data_nascimento ? new Date(aluno.data_nascimento).toLocaleDateString('pt-BR') : 'â€”'}
                    </td>
                    <td>
                      <span className={aluno.status === 'ativo' ? 'badge-green' : 'badge-gray'}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: aluno.status === 'ativo' ? '#16a34a' : '#9ca3af', flexShrink: 0 }} />
                        {aluno.status === 'ativo' ? 'Ativo' : 'Arquivado'}
                      </span>
                    </td>
                    <td>
                      {aluno.sync_status === 'pending' ? (
                        <span className="badge-orange">
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F59E0B', animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
                          Pendente
                        </span>
                      ) : (
                        <span className="badge-green">âœ“ Atualizado</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/alunos/${aluno.server_id || aluno.id}`}
                        style={{ fontSize: 12.5, fontWeight: 600, color: '#1A6F45', textDecoration: 'none' }}
                        onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                        onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                      >
                        Ver perfil â†’
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </AppShell>
  )
}

