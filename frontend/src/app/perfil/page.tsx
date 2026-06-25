'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/presentation/components/layout/AppShell'
import { UserCog, Save, Check } from 'lucide-react'
import { usePapel } from '@/application/hooks/usePapel'
import { useEscolas } from '@/application/hooks/useEscolas'
import { apiClient } from '@/infrastructure/http/client'

interface UserProfile {
  nome: string
  email: string
  escola_id: string | null
}

export default function PerfilPage() {
  const usuario = usePapel()
  const { escolas, isLoading: loadingEscolas } = useEscolas()

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<UserProfile>({
    nome: '',
    email: '',
    escola_id: null
  })

  // Limpa toast após 3 segundos
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  // Carrega os dados do perfil atual ao montar
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response: any = await apiClient.get('/api/usuarios/me')
        setFormData({
          nome: response.nome,
          email: response.email,
          escola_id: response.escola_id || null
        })
      } catch (error) {
        setToast({ message: 'Erro ao carregar os dados do perfil', type: 'error' })
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // 1. Atualizar o backend
      const response: any = await apiClient.patch('/api/usuarios/me', formData)
      
      // 2. Extrair o novo token da resposta
      const novoToken = response.access_token
      if (novoToken) {
        // Atualiza no localStorage
        localStorage.setItem('aee_token', novoToken)
        // Atualiza nos cookies (mesmo padrão usado no login)
        const expiry = new Date()
        expiry.setDate(expiry.getDate() + 7)
        document.cookie = `aee_token=${novoToken}; path=/; expires=${expiry.toUTCString()}; SameSite=Lax`
        
        setToast({ message: 'Perfil atualizado com sucesso!', type: 'success' })
        
        // Recarrega a página para que o `usePapel` leia o novo token e a Sidebar atualize o nome
        window.location.reload()
      } else {
        throw new Error('Novo token não recebido.')
      }

    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error)
      const msg = error.detail || error.message || 'Erro ao atualizar perfil. Verifique os dados.'
      setToast({ message: msg, type: 'error' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AppShell>
      <div className="max-w-[800px] mx-auto py-8 px-6">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm">
            <UserCog size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Meu Perfil</h1>
            <p className="text-sm text-slate-500 font-medium">Gerencie suas informações e preferências</p>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Carregando dados...</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Informações Pessoais</h3>
                  
                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nome}
                      onChange={e => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                      placeholder="Seu nome"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      E-mail (Usado para Login)
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                      placeholder="seu.email@exemplo.com"
                    />
                  </div>
                </div>

                <div className="h-px bg-slate-100 my-6" />

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Vínculo Institucional</h3>
                  
                  {/* Papel (Leitura Apenas) */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Papel no Sistema
                    </label>
                    <input
                      type="text"
                      disabled
                      value={usuario?.papel ? ({
                        'admin': 'Administrador',
                        'coordenacao': 'Coordenação',
                        'prof_aee': 'Professor AEE',
                        'prof_regente': 'Professor Regente',
                        'prof_apoio': 'Professor de Apoio'
                      }[usuario.papel] || usuario.papel) : ''}
                      className="w-full h-11 px-4 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-400 mt-1.5">Seu papel não pode ser alterado por você mesmo.</p>
                  </div>

                  {/* Escola */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Escola de Atuação
                    </label>
                    {loadingEscolas ? (
                      <div className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center">
                        <span className="text-slate-400 text-sm font-medium">Carregando escolas...</span>
                      </div>
                    ) : (
                      <select
                        value={formData.escola_id || ''}
                        onChange={e => setFormData({ ...formData, escola_id: e.target.value || null })}
                        className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                      >
                        <option value="">Selecione uma escola (Opcional para alguns papéis)</option>
                        {escolas.map(escola => (
                          <option key={escola.id} value={escola.id}>
                            {escola.nome}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 bg-primary text-white h-11 px-6 rounded-xl font-semibold hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed min-w-[160px]"
                  >
                    {isSaving ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={18} />
                        Salvar Alterações
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 z-[9999] animate-in fade-in slide-in-from-bottom-5">
          <div className={`px-4 py-3 rounded-lg shadow-lg text-sm font-semibold flex items-center gap-2 ${
            toast.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </AppShell>
  )
}
