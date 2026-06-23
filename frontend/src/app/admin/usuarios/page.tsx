'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/presentation/components/layout/AppShell'
import { ArrowLeft, UserPlus, X, Send, MoreVertical, Shield, Pencil, PowerOff } from 'lucide-react'
import Link from 'next/link'
import { getInitials } from '@/presentation/utils/utils'
import { apiClient } from '@/infrastructure/http/client'

// Tipagem baseada no backend
type PapelUsuario = 'admin' | 'coordenacao' | 'prof_aee' | 'prof_apoio' | 'prof_regente'

interface Usuario {
  id: string
  nome: string
  email: string
  papel: string
  status: 'ativo' | 'inativo' | 'pendente'
  escola_id?: string
}

export default function AdminUsuariosPage() {
  const [modalAberta, setModalAberta] = useState(false)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [escolas, setEscolas] = useState<{id: string, nome: string}[]>([])
  const [alunosDisponiveis, setAlunosDisponiveis] = useState<{id: string, nome: string}[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<Usuario | null>(null)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [papel, setPapel] = useState<PapelUsuario | ''>('')
  const [escolaId, setEscolaId] = useState<string>('')
  const [alunoIds, setAlunoIds] = useState<string[]>([])
  
  // Ações State
  const [modalVisualizacaoAberta, setModalVisualizacaoAberta] = useState(false)
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null)
  
  // Toast State
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)

  // Ocultar Toast automaticamente após 4 segundos
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  useEffect(() => {
    carregarUsuarios()
    carregarEscolas()
  }, [])

  async function carregarUsuarios() {
    try {
      const data = await apiClient.get<any>('/api/usuarios/')
      
      // Mapeia o campo "ativo" do backend para o campo "status" que o frontend usa visualmente
      const usuariosMapeados = (data?.items || []).map((u: any) => ({
        ...u,
        status: u.ativo ? 'ativo' : 'inativo'
      }))
      
      setUsuarios(usuariosMapeados)
    } catch (err) {
      console.error('Erro ao buscar usuários, usando fallback local temporário:', err)
      // Fallback temporário caso a API de listagem não esteja pronta
      setUsuarios([
        { id: '00000000-0000-0000-0000-000000000001', nome: 'Valdirene Pereira', email: 'valdirene@escola.gov.br', papel: 'prof_aee', status: 'ativo' },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function carregarEscolas() {
    try {
      const data = await apiClient.get<any>('/api/escolas/')
      setEscolas(data || [])
    } catch (err) {
      console.error('Erro ao buscar escolas', err)
    }
  }

  // Efeito para carregar alunos quando a escola mudar e o papel for prof_regente
  useEffect(() => {
    if (papel === 'prof_regente' && escolaId) {
      carregarAlunosDaEscola(escolaId)
    } else {
      setAlunosDisponiveis([])
    }
  }, [papel, escolaId])

  async function carregarAlunosDaEscola(idEscola: string) {
    try {
      const data = await apiClient.get<any>(`/api/alunos/?escola_id=${idEscola}`)
      setAlunosDisponiveis(data || [])
    } catch (err) {
      console.error('Erro ao buscar alunos da escola', err)
    }
  }

  function abrirModalCadastro() {
    setUsuarioEmEdicao(null)
    setNome('')
    setEmail('')
    setSenha('')
    setPapel('')
    setEscolaId('')
    setAlunoIds([])
    setModalAberta(true)
  }

  function abrirModalEdicao(u: Usuario) {
    setUsuarioEmEdicao(u)
    setNome(u.nome)
    setEmail(u.email)
    setSenha('') // Senha não é editada aqui
    setPapel(u.papel as PapelUsuario)
    setEscolaId(u.escola_id || '')
    setAlunoIds([])
    setModalAberta(true)
    
    if (u.papel === 'prof_regente') {
      carregarAlunosDoUsuario(u.id)
    }
  }

  async function carregarAlunosDoUsuario(userId: string) {
    try {
      const ids = await apiClient.get<string[]>(`/api/usuarios/${userId}/alunos`)
      setAlunoIds(ids || [])
    } catch (err) {
      console.error('Erro ao buscar alunos do usuário', err)
    }
  }

  function abrirModalVisualizacao(u: Usuario) {
    setUsuarioSelecionado(u)
    setModalVisualizacaoAberta(true)
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (usuarioEmEdicao) {
        // Fluxo de Edição (PUT)
        const userAtualizado = await apiClient.put<any>(`/api/usuarios/${usuarioEmEdicao.id}`, {
          nome,
          papel,
          escola_id: escolaId || null,
          aluno_ids: papel === 'prof_regente' ? alunoIds : []
        })
        
        const userAtualizadoObj = {
          ...usuarioEmEdicao, 
          nome: userAtualizado.nome, 
          papel: userAtualizado.papel,
          escola_id: escolaId || undefined
        }
        setUsuarios(usuarios.map(u => u.id === usuarioEmEdicao.id ? userAtualizadoObj : u))
        
        if (usuarioSelecionado?.id === usuarioEmEdicao.id) {
          setUsuarioSelecionado(userAtualizadoObj)
        }
        
        setToast({ message: 'Usuário atualizado com sucesso!', type: 'success' })
      } else {
        // Fluxo de Cadastro (POST)
        const novoUser = await apiClient.post<any>('/api/usuarios/', {
          nome,
          email,
          password: senha,
          papel,
          escola_id: escolaId || null,
          aluno_ids: papel === 'prof_regente' ? alunoIds : []
        })
        
        setUsuarios([...usuarios, { ...novoUser, status: 'ativo' }])
        setToast({ message: 'Usuário cadastrado com sucesso!', type: 'success' })
      }
      
      setModalAberta(false)
    } catch (err: any) {
      console.error(err)
      let msg = 'Erro ao salvar usuário.'
      if (Array.isArray(err?.detail)) {
        msg = err.detail.map((e: any) => e.msg).join(', ')
      } else if (typeof err?.detail === 'string') {
        msg = err.detail
      }
      setToast({ message: msg, type: 'error' })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleStatus(u: Usuario) {
    const novoStatus = u.status === 'inativo' // Se inativo, vai pra true (ativo). Se ativo, false (inativo).
    
    try {
      await apiClient.patch(`/api/usuarios/${u.id}/status`, { ativo: novoStatus })
      const statusString = novoStatus ? 'ativo' : 'inativo'
      setUsuarios(usuarios.map(user => user.id === u.id ? { ...user, status: statusString } : user))
      
      if (usuarioSelecionado?.id === u.id) {
        setUsuarioSelecionado({ ...u, status: statusString })
      }
      
      setToast({ message: `Usuário ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`, type: 'success' })
    } catch (err: any) {
      console.error(err)
      setToast({ message: err?.detail || 'Erro ao alterar status do usuário', type: 'error' })
    }
  }



  function formatarPapel(papel: string) {
    const mapa: Record<string, string> = {
      'admin': 'Admin',
      'coordenacao': 'Coordenação',
      'prof_aee': 'Prof. AEE',
      'prof_apoio': 'Prof. de Apoio',
      'prof_regente': 'Prof. Regente'
    }
    return mapa[papel] || papel
  }

  function formatarEscola(escolaId?: string) {
    if (!escolaId) return '-'
    const escola = escolas.find(e => e.id === escolaId)
    return escola ? escola.nome : '-'
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
            onClick={abrirModalCadastro}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-[0.98]"
          >
            <UserPlus size={16} />
            Cadastrar Usuário
          </button>
        </div>

        {/* Lista */}
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider rounded-tl-2xl">Usuário</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Papel</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Escola</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right rounded-tr-2xl">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">Carregando usuários...</td></tr>
                ) : usuarios.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">Nenhum usuário cadastrado.</td></tr>
                ) : usuarios.map((u) => (
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
                            {u.status === 'inativo' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-600 border border-red-200 uppercase tracking-wider">
                                Inativo
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
                        {formatarPapel(u.papel)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg">
                        {formatarEscola(u.escola_id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => abrirModalVisualizacao(u)}
                        className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>

      {/* Modal Cadastrar / Editar */}
      {modalAberta && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-4 sm:p-6 transition-opacity">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 sm:p-8 shadow-xl animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {usuarioEmEdicao ? 'Editar Usuário' : 'Cadastrar Usuário'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {usuarioEmEdicao ? 'Altere as informações deste profissional.' : 'Crie uma conta para um novo profissional.'}
                </p>
              </div>
              <button 
                onClick={() => setModalAberta(false)} 
                aria-label="Fechar"
                className="p-2 -mt-4 -mr-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSalvar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome completo</label>
                <input 
                  type="text" 
                  required 
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Ana Beatriz Silva"
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
                <input 
                  type="email" 
                  required 
                  disabled={!!usuarioEmEdicao} // Não permite editar email
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ana@escola.gov.br"
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow disabled:bg-slate-50 disabled:text-slate-500" 
                />
              </div>
              {!usuarioEmEdicao && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha Inicial</label>
                  <input 
                    type="password" 
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow" 
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Papel no sistema</label>
                <select 
                  required 
                  value={papel}
                  onChange={(e) => setPapel(e.target.value as PapelUsuario)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow appearance-none cursor-pointer"
                >
                  <option value="" disabled>Selecione o papel...</option>
                  <option value="admin">Administrador</option>
                  <option value="coordenacao">Coordenação</option>
                  <option value="prof_aee">Professora AEE</option>
                  <option value="prof_apoio">Prof. de Apoio</option>
                  <option value="prof_regente">Prof. Regente</option>
                </select>
              </div>

              {(papel === 'prof_apoio' || papel === 'prof_regente') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Escola Associada</label>
                  <select 
                    required 
                    value={escolaId}
                    onChange={(e) => setEscolaId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Selecione a escola...</option>
                    {escolas.map(esc => (
                      <option key={esc.id} value={esc.id}>{esc.nome}</option>
                    ))}
                  </select>
                </div>
              )}

              {papel === 'prof_regente' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Alunos Atribuídos</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
                    {alunosDisponiveis.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-2">Nenhum aluno encontrado nesta escola.</p>
                    ) : (
                      alunosDisponiveis.map(aluno => (
                        <label key={aluno.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer p-1 hover:bg-slate-100 rounded">
                          <input 
                            type="checkbox" 
                            checked={alunoIds.includes(aluno.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setAlunoIds([...alunoIds, aluno.id])
                              } else {
                                setAlunoIds(alunoIds.filter(id => id !== aluno.id))
                              }
                            }}
                            className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary/20"
                          />
                          {aluno.nome}
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setModalAberta(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 font-semibold text-sm rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Salvando...' : <><Send size={16} /> Salvar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualização */}
      {modalVisualizacaoAberta && usuarioSelecionado && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-4 sm:p-6 transition-opacity">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 sm:p-8 shadow-xl animate-in fade-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-primary text-lg font-bold shrink-0">
                  {getInitials(usuarioSelecionado.nome)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    {usuarioSelecionado.nome}
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">{usuarioSelecionado.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setModalVisualizacaoAberta(false)} 
                aria-label="Fechar"
                className="p-2 -mr-2 -mt-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm text-slate-500">Status</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${usuarioSelecionado.status === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {usuarioSelecionado.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm text-slate-500">Papel</span>
                <span className="text-sm font-semibold text-slate-900">{formatarPapel(usuarioSelecionado.papel)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-sm text-slate-500">Escola</span>
                <span className="text-sm font-semibold text-slate-900">{formatarEscola(usuarioSelecionado.escola_id)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
              <button 
                onClick={() => {
                  setModalVisualizacaoAberta(false)
                  abrirModalEdicao(usuarioSelecionado)
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 font-semibold text-sm rounded-lg hover:bg-slate-200 transition-colors"
              >
                <Pencil size={16} /> Editar
              </button>
              <button 
                onClick={() => handleToggleStatus(usuarioSelecionado)}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-lg transition-colors ${
                  usuarioSelecionado.status === 'ativo' 
                    ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                    : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}
              >
                <PowerOff size={16} /> {usuarioSelecionado.status === 'ativo' ? 'Desativar' : 'Reativar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
            toast.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <span>{toast.message}</span>
            <button 
              onClick={() => setToast(null)}
              className="p-1 rounded-full hover:bg-black/5 transition-colors"
              aria-label="Fechar"
            >
              <X size={16} className="opacity-70" />
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}
