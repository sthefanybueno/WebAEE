'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { ArrowLeft, UserPlus, X, Send, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { cn, getInitials } from '@/lib/utils'

const USUARIOS_MOCK = [
  { id: '1', nome: 'Valdirene Pereira', email: 'valdirene@escola.gov.br', papel: 'Prof. AEE',    status: 'ativo'     as const },
  { id: '2', nome: 'Gabriela Borges',   email: 'gabriela@escola.gov.br',  papel: 'Prof. Apoio', status: 'ativo'     as const },
  { id: '3', nome: 'Ricardo Mendes',    email: 'ricardo@escola.gov.br',   papel: 'Regente',     status: 'ativo'     as const },
  { id: '4', nome: 'Maria Costa',       email: 'maria@escola.gov.br',     papel: 'Coord.',      status: 'pendente'  as const },
]

export default function AdminUsuariosPage() {
  const [modal, setModal] = useState(false)
  const [enviado, setEnviado] = useState(false)

  function handleConvidar(e: React.FormEvent) {
    e.preventDefault()
    setEnviado(true)
    setTimeout(() => { setEnviado(false); setModal(false) }, 2000)
  }

  return (
    <AppShell
      role="coordenacao"
      header={
        <>
          <Link href="/dashboard" aria-label="Voltar" className="p-2 -ml-2 rounded-full hover:bg-[--color-primary-light] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-[18px] font-bold text-[--color-text-primary]">Cadastro de Usuários</h1>
          <button onClick={() => setModal(true)} aria-label="Convidar usuário"
            className="p-2 rounded-full bg-[--color-primary] text-white hover:bg-[--color-primary-hover] transition-colors">
            <UserPlus size={18} />
          </button>
        </>
      }
    >
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-[22px] font-bold text-[--color-text-primary]">Usuários</h2>
            <p className="text-[15px] text-[--color-text-secondary]">Gerencie o acesso dos profissionais.</p>
          </div>
          <button onClick={() => setModal(true)}
            className="hidden sm:flex items-center gap-2 min-h-[44px] px-4 bg-[--color-primary] text-white font-bold rounded-xl hover:bg-[--color-primary-hover] transition-colors text-[15px]">
            <UserPlus size={16} /> Convidar
          </button>
        </div>

        {/* Lista */}
        <div className="flex flex-col gap-3">
          {USUARIOS_MOCK.map((u) => (
            <div key={u.id}
              className={cn('flex items-center gap-4 p-4 bg-[--color-surface-card] rounded-2xl border transition-all',
                u.status === 'pendente' ? 'border-amber-200' : 'border-[--color-border]'
              )}>
              <div className="w-11 h-11 rounded-full bg-[--color-primary-light] flex items-center justify-center text-[--color-primary] font-bold text-sm shrink-0">
                {getInitials(u.nome)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[--color-text-primary] truncate">{u.nome}</p>
                <p className="text-[13px] text-[--color-text-secondary] truncate">{u.email}</p>
                {u.status === 'pendente' && (
                  <p className="text-[12px] font-bold text-[--color-status-warning]">⏳ Convite pendente</p>
                )}
              </div>
              <span className={cn('shrink-0 px-2.5 py-1 rounded-full text-[12px] font-bold',
                u.status === 'pendente'
                  ? 'bg-amber-100 text-[--color-status-warning]'
                  : 'bg-[--color-primary-light] text-[--color-primary]'
              )}>
                {u.papel}
              </span>
              <button aria-label="Mais opções" className="p-2 rounded-full hover:bg-[--color-surface] transition-colors shrink-0">
                <MoreVertical size={16} className="text-[--color-text-secondary]" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal convidar */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end md:items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[18px] font-bold text-[--color-text-primary]">Convidar Usuário</h3>
              <button onClick={() => setModal(false)} aria-label="Fechar"
                className="p-2 rounded-full hover:bg-[--color-surface] transition-colors">
                <X size={18} />
              </button>
            </div>
            {enviado ? (
              <div className="text-center py-8">
                <span className="text-5xl">✅</span>
                <p className="font-bold text-[--color-primary] mt-3">Convite enviado por e-mail!</p>
              </div>
            ) : (
              <form onSubmit={handleConvidar} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-[--color-text-secondary]">Nome completo</label>
                  <input type="text" required placeholder="Ex: Ana Beatriz Silva"
                    className="min-h-[48px] px-4 rounded-xl border border-[--color-border] bg-[--color-surface] outline-none focus:border-[--color-primary] transition-colors text-[15px]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-[--color-text-secondary]">E-mail institucional</label>
                  <input type="email" required placeholder="ana@escola.gov.br"
                    className="min-h-[48px] px-4 rounded-xl border border-[--color-border] bg-[--color-surface] outline-none focus:border-[--color-primary] transition-colors text-[15px]" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-[--color-text-secondary]">Papel no sistema</label>
                  <select required className="min-h-[48px] px-4 rounded-xl border border-[--color-border] bg-[--color-surface] outline-none focus:border-[--color-primary] transition-colors text-[15px] appearance-none">
                    <option value="">Selecione o papel</option>
                    <option>Professora AEE</option>
                    <option>Prof. de Apoio</option>
                    <option>Prof. Regente</option>
                    <option>Coordenação</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setModal(false)}
                    className="flex-1 min-h-[48px] border border-[--color-border] text-[--color-text-secondary] font-bold rounded-xl hover:bg-[--color-surface] transition-colors">
                    Cancelar
                  </button>
                  <button type="submit"
                    className="flex-[2] min-h-[48px] bg-[--color-primary] hover:bg-[--color-primary-hover] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                    <Send size={16} /> Enviar Convite
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </AppShell>
  )
}
