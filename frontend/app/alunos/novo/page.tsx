'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { ArrowLeft, Save, Info } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { salvarAlunoLocal } from '@/hooks/useAlunos'

export default function NovoAlunoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [lgpd, setLgpd] = useState(false)

  async function handleSalvar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!lgpd) { alert('Confirme o consentimento LGPD antes de salvar.'); return }

    const formData = new FormData(e.currentTarget)
    const nome = formData.get('nome') as string
    const escola = formData.get('escola') as string
    const nascimento = formData.get('nascimento') as string
    const laudo = formData.get('laudo') as string

    if (!nome || !escola || !nascimento) { alert('Preencha os campos obrigatórios (*).'); return }

    setLoading(true)
    try {
      await salvarAlunoLocal({ nome, escola, data_nascimento: nascimento, laudo: laudo || '', status: 'ativo' })
      router.push('/alunos')
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar aluno localmente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell title="Novo Aluno">
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 28px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <Link
            href="/alunos"
            style={{
              width: 36, height: 36, borderRadius: 9, border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-secondary)', textDecoration: 'none',
              background: 'white', transition: 'background 0.15s',
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={17} />
          </Link>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)' }}>Novo Aluno</h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              Preencha as informações para iniciar o acompanhamento especializado.
            </p>
          </div>
        </div>

        <form onSubmit={handleSalvar} id="form-novo-aluno">

          {/* Card: Dados Pessoais */}
          <div className="card" style={{ overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--c-gray-50)' }}>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text-primary)' }}>Dados Pessoais</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>Informações básicas de identificação.</p>
            </div>
            <div style={{ padding: '20px 20px', display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="nome" className="form-label">Nome Completo *</label>
                <input id="nome" name="nome" type="text" required placeholder="Ex: João da Silva Santos" className="form-input" />
              </div>
              <div>
                <label htmlFor="nascimento" className="form-label">Data de Nascimento *</label>
                <input id="nascimento" name="nascimento" type="date" required className="form-input" />
              </div>
              <div>
                <label htmlFor="escola" className="form-label">Escola Vinculada *</label>
                <select id="escola" name="escola" required className="form-input" style={{ cursor: 'pointer' }}>
                  <option value="">Selecione a unidade</option>
                  <option value="E.E. Castelo Branco">E.E. Castelo Branco</option>
                  <option value="E.M. Flores do Campo">E.M. Flores do Campo</option>
                  <option value="E.M. Primavera">E.M. Primavera</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card: Informações Clínicas */}
          <div className="card" style={{ overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--c-gray-50)' }}>
              <p style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text-primary)' }}>Informações Clínicas</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>Dados sensíveis — acesso auditado conforme LGPD Art. 58 LDB.</p>
            </div>
            <div style={{ padding: '20px 20px', display: 'grid', gap: 16 }}>
              <div>
                <label htmlFor="laudo" className="form-label">Laudo / Diagnóstico Principal</label>
                <textarea
                  id="laudo"
                  name="laudo"
                  rows={4}
                  placeholder="Descreva as principais características clínicas e pedagógicas..."
                  className="form-input"
                  style={{ resize: 'vertical', minHeight: 90 }}
                />
                <p style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  <Info size={12} /> Campo sensível — visível apenas para profissionais autorizados.
                </p>
              </div>
              <div>
                <label htmlFor="professor" className="form-label">Professor de Apoio Vinculado</label>
                <select id="professor" name="professor" className="form-input" style={{ cursor: 'pointer' }}>
                  <option value="">Selecionar profissional</option>
                  <option value="Ana Beatriz">Profª Ana Beatriz (Especialista TEA)</option>
                  <option value="Ricardo Mendes">Prof. Ricardo Mendes (Psicopedagogo)</option>
                </select>
              </div>
            </div>
          </div>

          {/* LGPD */}
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '14px 18px', marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={lgpd}
                onChange={e => setLgpd(e.target.checked)}
                style={{ marginTop: 2, width: 17, height: 17, accentColor: '#1A6F45', cursor: 'pointer', flexShrink: 0 }}
              />
              <span style={{ fontSize: 13, color: '#1E40AF', lineHeight: 1.5 }}>
                Confirmo que obtive o <strong>consentimento LGPD</strong> do responsável legal para
                registro e tratamento dos dados deste estudante (base legal: Art. 58 LDB).
              </span>
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Link href="/alunos" className="btn-ghost">Cancelar</Link>
            <button
              type="submit"
              disabled={loading || !lgpd}
              className="btn-primary"
              style={{ opacity: (loading || !lgpd) ? 0.55 : 1, cursor: (loading || !lgpd) ? 'not-allowed' : 'pointer' }}
            >
              <Save size={15} />
              {loading ? 'Salvando...' : 'Salvar Aluno'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}
