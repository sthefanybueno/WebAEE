'use client'

import { useState } from 'react'
import { AppShell } from '@/presentation/components/layout/AppShell'
import { Search, Plus, Loader2, AlertCircle, CheckCircle2, Clock, Users, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getInitials } from '@/presentation/utils/utils'
import { useAlunos, useEscolas } from '@/application/hooks/useAlunos'

type Filtro = 'todos' | 'local' | 'synced'

export default function AlunosPage() {
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'ativo' | 'arquivado' | 'todos'>('ativo')
  const [filtroEscola, setFiltroEscola] = useState('todas')
  
  const { alunos, loading } = useAlunos(filtroStatus, busca, 'todos', filtroEscola)
  const escolas = useEscolas()

  return (
    <AppShell title="Alunos">
      <div className="max-w-5xl mx-auto p-6 lg:p-8 space-y-6">

        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
              Alunos
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {loading
                ? 'Carregando...'
                : `${alunos.length} aluno${alunos.length !== 1 ? 's' : ''} encontrado${alunos.length !== 1 ? 's' : ''}`
              }
            </p>
          </div>

          <Link 
            href="/alunos/novo" 
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-[0.98]"
          >
            <Plus size={16} />
            Novo Aluno
          </Link>
        </div>

        {/* ── Barra de busca e filtros ─────────────────────── */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px] w-full">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="search"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar pelo nome..."
              className="w-full h-10 pl-10 pr-10 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
            />
            {loading && (
              <Loader2
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 animate-spin"
              />
            )}
          </div>
          
          {/* Filtros */}
          <div className="flex flex-row gap-3 w-full md:w-auto">
            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value as any)}
              className="h-10 bg-white border border-slate-300 rounded-lg text-sm text-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
            >
              <option value="ativo">Ativos</option>
              <option value="arquivado">Desativados</option>
              <option value="todos">Todos (Status)</option>
            </select>

            <select
              value={filtroEscola}
              onChange={e => setFiltroEscola(e.target.value)}
              className="h-10 flex-1 md:flex-none min-w-[140px] bg-white border border-slate-300 rounded-lg text-sm text-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
            >
              <option value="todas">Todas Escolas</option>
              {escolas.map(escola => (
                <option key={escola} value={escola}>{escola}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Conteúdo ─────────────────────────────────────── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 size={32} className="text-slate-400 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Carregando alunos...</p>
          </div>

        ) : alunos.length === 0 ? (
          <div className="bg-white border border-slate-200/60 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 border border-slate-100">
              <Users size={28} className="text-slate-400" />
            </div>
            <p className="text-lg font-bold text-slate-900">Nenhum aluno encontrado</p>
            <p className="text-sm text-slate-500 mt-2 mb-8 max-w-sm leading-relaxed">
              {busca ? 'Tente outros termos de busca ou ajuste os filtros.' : 'Cadastre o primeiro aluno para começar o acompanhamento.'}
            </p>
            <Link 
              href="/alunos/novo" 
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-[0.98]"
            >
              <Plus size={16} /> Cadastrar Aluno
            </Link>
          </div>

        ) : (
          <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Aluno</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Escola</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nascimento</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sincronização</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alunos.map(a => (
                    <tr 
                      key={a.server_id ?? a.id}
                      className="group hover:bg-slate-50/80 transition-colors duration-150"
                    >
                      {/* Nome */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full shrink-0 bg-green-50 flex items-center justify-center text-primary text-xs font-bold tracking-wide">
                            {getInitials(a.nome)}
                          </div>
                          <span className="font-semibold text-sm text-slate-900">{a.nome}</span>
                        </div>
                      </td>

                      {/* Escola */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {a.escola_atual || '—'}
                      </td>

                      {/* Nascimento */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {a.data_nascimento
                          ? new Date(a.data_nascimento).toLocaleDateString('pt-BR')
                          : '—'}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          a.status === 'ativo' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {a.status === 'ativo' && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-glow-pulse" />
                          )}
                          {a.status === 'ativo' ? 'Ativo' : 'Arquivado'}
                        </span>
                      </td>

                      {/* Sync */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {a.sync_status === 'local' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                            <Clock size={12} className="shrink-0" />
                            Pendente
                          </span>
                        ) : a.sync_status === 'failed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                            <AlertCircle size={12} className="shrink-0" />
                            Falhou
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle2 size={12} className="shrink-0" />
                            Sincronizado
                          </span>
                        )}
                      </td>

                      {/* Ação */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/alunos/${a.server_id ?? a.id}`}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                          title="Ver perfil"
                        >
                          <ChevronRight size={18} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
