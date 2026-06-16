'use client'

import { useState } from 'react'
import { AppShell } from '@/presentation/components/layout/AppShell'
import { ArrowLeft, UserPlus, X, Send, MoreVertical, Shield } from 'lucide-react'
import Link from 'next/link'
import { cn, getInitials } from '@/presentation/utils/utils'

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
    <AppShell title="Cadastro de Usuários">
      <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <Link 
              href="/dashboard" 
              className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0 mt-1 sm:mt-0"
              aria-label="Voltar"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
                Usuários
              </h2>
              <p className="text-sm text-slate-500 mt-1">Gerencie o acesso dos profissionais da equipe.</p>
            </div>
          </div>
          
          <button 
            onClick={() => setModal(true)}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-[0.98]"
          >
            <UserPlus size={16} />
            Convidar
          </button>
        </div>

        {/* Lista */}
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Usuário</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Papel</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {USUARIOS_MOCK.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors duration-150 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                          {getInitials(u.nome)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm text-slate-900 group-hover:text-primary transition-colors">
                              {u.nome}
                            </p>
                            {u.status === 'pendente' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wider">
                                Pendente
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg">
                        <Shield size={12} className="text-slate-400" />
                        {u.papel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button aria-label="Mais opções" className="inline-flex items-center justify-center w-8 h-8 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal convidar */}
      {modal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-4 sm:p-6 transition-opacity">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 sm:p-8 shadow-xl animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Convidar Usuário</h3>
                <p className="text-sm text-slate-500 mt-1">Envie um convite para ingressar na plataforma.</p>
              </div>
              <button 
                onClick={() => setModal(false)} 
                aria-label="Fechar"
                className="p-2 -mt-4 -mr-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {enviado ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-bold text-slate-900 text-lg">Convite enviado!</p>
                <p className="text-sm text-slate-500 mt-1">O usuário receberá um e-mail em breve.</p>
              </div>
            ) : (
              <form onSubmit={handleConvidar} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome completo</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Ana Beatriz Silva"
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail institucional</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="ana@escola.gov.br"
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Papel no sistema</label>
                  <select 
                    required 
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow appearance-none cursor-pointer"
                  >
                    <option value="">Selecione o papel...</option>
                    <option>Professora AEE</option>
                    <option>Prof. de Apoio</option>
                    <option>Prof. Regente</option>
                    <option>Coordenação</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setModal(false)}
                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold text-sm rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-[0.98]"
                  >
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
