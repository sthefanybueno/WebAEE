'use client'

import { Leaf, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setLoading(true)
    
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username: email, password: senha })
      })

      if (res.ok) {
        const data = await res.json()
        document.cookie = `aee_token=${data.access_token}; path=/`
        localStorage.setItem('aee_token', data.access_token)
        router.push('/dashboard')
      } else {
        const errorData = await res.json().catch(() => null)
        setErro(errorData?.detail || 'E-mail ou senha incorretos.')
      }
    } catch (err) {
      setErro('Erro ao conectar ao servidor. Verifique se o backend está rodando.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] bg-slate-50">

      {/* ── Left branding panel ── */}
      <div 
        className="hidden md:flex flex-col relative overflow-hidden"
        style={{
          width: 440, flexShrink: 0, background: 'linear-gradient(155deg, #1e7c4e 0%, #1A6F45 55%, #155838 100%)',
          padding: '40px 44px'
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-[280px] h-[280px] rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-16 -left-10 w-[220px] h-[220px] rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute top-[45%] left-[60%] w-[140px] h-[140px] rounded-full bg-white/5 pointer-events-none" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
            <Leaf size={22} color="white" />
          </div>
          <div>
            <p className="text-[17px] font-bold text-white leading-tight">Sistema AEE</p>
            <p className="text-[11px] text-white/60 mt-0.5">Atendimento Educacional Especializado</p>
          </div>
        </div>

        {/* Headline */}
        <div className="flex-1 flex flex-col justify-center relative z-10">
          <h1 className="text-[30px] font-bold text-white leading-snug mb-7">
            Acompanhamento<br />pedagógico ao seu<br />alcance, mesmo offline.
          </h1>
        </div>

        <p className="text-[11px] text-white/30 relative z-10">© 2025 Sistema AEE • v1.0.0</p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="flex md:hidden items-center justify-center gap-2.5 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Leaf size={20} color="white" />
            </div>
            <span className="text-lg font-bold text-primary">Sistema AEE</span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8 sm:p-10">
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Seja Bem-Vinda</h2>
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="professor@email.com"
                  required
                  autoFocus
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
                />
              </div>

              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-slate-700 mb-1.5">Senha</label>
                <div className="relative">
                  <input
                    id="senha"
                    type={showSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 flex items-center justify-center"
                    aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {erro && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-1">
                  <p className="text-sm font-medium text-red-600">{erro}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-[0.98] mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Entrando...' : 'Entrar no sistema'}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  )
}
