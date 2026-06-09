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
    await new Promise(r => setTimeout(r, 700))
    if (email === 'professor@aee.gov.br' && senha === 'senha') {
      document.cookie = 'aee_token=mock_token; path=/'
      localStorage.setItem('aee_token', 'mock_token')
      router.push('/dashboard')
    } else {
      setErro('E-mail ou senha incorretos.')
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--c-gray-50)' }}>

      {/* ── Left branding panel ── */}
      <div style={{
        width: 440, flexShrink: 0, background: 'linear-gradient(155deg, #1e7c4e 0%, #1A6F45 55%, #155838 100%)',
        display: 'flex', flexDirection: 'column', padding: '40px 44px',
        position: 'relative', overflow: 'hidden',
      }}
        className="login-panel"
      >
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -40, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '45%', left: '60%', width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Leaf size={22} color="white" />
          </div>
          <div>
            <p style={{ fontSize: 17, fontWeight: 700, color: 'white', lineHeight: 1.1 }}>Sistema AEE</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>Atendimento Educacional Especializado</p>
          </div>
        </div>

        {/* Headline */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'white', lineHeight: 1.3, marginBottom: 28 }}>
            Acompanhamento<br />pedagógico ao seu<br />alcance, mesmo offline.
          </h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '🌱', text: 'Funciona 100% offline via IndexedDB' },
              { icon: '📸', text: 'Registro de momentos pedagógicos' },
              { icon: '📋', text: 'Relatórios e acompanhamentos diários' },
              { icon: '🔒', text: 'Dados protegidos — LGPD Art. 58 LDB' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 17, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
                <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.78)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', position: 'relative', zIndex: 1 }}>© 2025 Sistema AEE • v1.0.0</p>
      </div>

      {/* ── Right form panel ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile logo */}
          <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }} className="login-mobile-logo">
            <div style={{ width: 40, height: 40, borderRadius: 11, background: '#1A6F45', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={20} color="white" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#1A6F45' }}>Sistema AEE</span>
          </div>

          {/* Card */}
          <div className="card" style={{ padding: '36px 32px' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>Bem-vinda de volta</h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 28 }}>
              Entre com suas credenciais para acessar o sistema.
            </p>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label htmlFor="email" className="form-label">E-mail institucional</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="professor@escola.gov.br"
                  required
                  autoFocus
                  className="form-input"
                />
              </div>

              <div>
                <label htmlFor="senha" className="form-label">Senha</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="senha"
                    type={showSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="form-input"
                    style={{ paddingRight: 42 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(v => !v)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--c-gray-400)', display: 'flex', alignItems: 'center',
                      padding: 4,
                    }}
                    aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showSenha ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {erro && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9, padding: '10px 14px' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#DC2626' }}>{erro}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ justifyContent: 'center', padding: '11px 20px', fontSize: 14, marginTop: 4, opacity: loading ? 0.7 : 1 }}
              >
                {loading && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                {loading ? 'Entrando...' : 'Entrar no sistema'}
              </button>
            </form>

            {/* Demo hint */}
            <div style={{ marginTop: 20, background: 'var(--c-gray-50)', border: '1px solid var(--color-border)', borderRadius: 9, padding: '10px 14px' }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                🔑 <strong>Demo:</strong>{' '}
                <code style={{ background: 'white', padding: '1px 6px', borderRadius: 4, color: '#1A6F45', fontSize: 12 }}>professor@aee.gov.br</code>
                {' / '}
                <code style={{ background: 'white', padding: '1px 6px', borderRadius: 4, color: '#1A6F45', fontSize: 12 }}>senha</code>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .login-panel { display: none !important; }
          .login-mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
