'use client'

/**
 * NovoAlunoPage — Thin Component (Apresentação pura).
 * Toda lógica vive no Fat Hook `useNovoAlunoForm`.
 */

import { AppShell } from '@/presentation/components/layout/AppShell'
import { ArrowLeft, Save, Info, Loader2, AlertCircle, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useNovoAlunoForm } from '@/application/hooks/useNovoAlunoForm'

export default function NovoAlunoPage() {
  const { register, errors, onSubmit, isSubmitting, erroGlobal, escolas, escolasLoading } = useNovoAlunoForm()

  return (
    <AppShell title="Novo Aluno">
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '36px 24px' }}>

        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex items-center gap-3" style={{ marginBottom: 32 }}>
          <Link href="/alunos" className="btn-icon" style={{ flexShrink: 0 }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h2 style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-.025em', color: 'var(--s-900)', lineHeight: 1.2 }}>
              Novo Aluno
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--color-sub)', marginTop: 4 }}>
              Preencha os dados para iniciar o acompanhamento especializado.
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Erro global ───────────────────────────────── */}
          {erroGlobal && (
            <div className="flex items-start gap-3" style={{ padding: '14px 16px', background: 'var(--r-50)', border: '1px solid var(--r-100)', borderRadius: 'var(--r-lg)' }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--r-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertCircle size={14} color="var(--r-600)" />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 13.5, color: '#991b1b' }}>Erro ao salvar</p>
                <p style={{ fontSize: 13, color: '#b91c1c', marginTop: 2 }}>{erroGlobal}</p>
              </div>
            </div>
          )}

          {/* ── Card: Dados Pessoais ──────────────────────── */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-head">
              <p className="card-head-title">Dados Pessoais</p>
              <p className="card-head-desc">Informações básicas de identificação do estudante.</p>
            </div>

            <div style={{ padding: '22px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Nome */}
              <div>
                <label htmlFor="nome" className="label">
                  Nome Completo <span style={{ color: 'var(--r-600)' }}>*</span>
                </label>
                <input
                  id="nome"
                  type="text"
                  placeholder="Ex: João da Silva Santos"
                  className={`input${errors.nome ? ' error' : ''}`}
                  {...register('nome')}
                />
                {errors.nome && (
                  <p className="form-error">
                    <AlertCircle size={11} />{errors.nome.message}
                  </p>
                )}
              </div>

              {/* Nascimento + Escola — 2 colunas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nascimento" className="label">
                    Data de Nascimento <span style={{ color: 'var(--r-600)' }}>*</span>
                  </label>
                  <input
                    id="nascimento"
                    type="date"
                    className={`input${errors.nascimento ? ' error' : ''}`}
                    {...register('nascimento')}
                  />
                  {errors.nascimento && (
                    <p className="form-error">
                      <AlertCircle size={11} />{errors.nascimento.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="escola_atual_id" className="label">
                    Escola Vinculada <span style={{ color: 'var(--r-600)' }}>*</span>
                  </label>
                  <select
                    id="escola_atual_id"
                    className={`input${errors.escola_atual_id ? ' error' : ''}`}
                    {...register('escola_atual_id')}
                    disabled={escolasLoading}
                  >
                    <option value="">
                      {escolasLoading ? 'Carregando...' : 'Selecione a escola'}
                    </option>
                    {escolas.map(e => (
                      <option key={e.id} value={e.id}>{e.nome}</option>
                    ))}
                  </select>
                  {errors.escola_atual_id && (
                    <p className="form-error">
                      <AlertCircle size={11} />{errors.escola_atual_id.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Card: Informações Clínicas ────────────────── */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-head">
              <p className="card-head-title">Informações Clínicas</p>
              <p className="card-head-desc">Dados sensíveis — acesso auditado (LGPD Art. 58 LDB).</p>
            </div>

            <div style={{ padding: '22px 22px' }}>
              <label htmlFor="diagnostico" className="label">
                Laudo / Diagnóstico Principal
              </label>
              <textarea
                id="diagnostico"
                rows={4}
                placeholder="Descreva as características clínicas e pedagógicas relevantes..."
                className="input"
                {...register('diagnostico')}
              />
              <p className="form-hint">
                <Info size={11} />
                Visível apenas para profissionais autorizados.
              </p>
            </div>
          </div>

          {/* ── LGPD ─────────────────────────────────────── */}
          <div style={{ background: 'var(--b-50)', border: '1px solid var(--b-100)', borderRadius: 'var(--r-lg)', padding: '16px 18px' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
              <ShieldCheck size={14} color="var(--b-600)" />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1e40af' }}>Consentimento LGPD</span>
            </div>
            <label className="flex items-start gap-3" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                style={{ marginTop: 2, width: 16, height: 16, accentColor: 'var(--g-700)', cursor: 'pointer', flexShrink: 0 }}
                {...register('lgpd')}
              />
              <span style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.6 }}>
                Confirmo que obtive o <strong>consentimento do responsável legal</strong> para
                registro e tratamento dos dados deste estudante (Art. 58 LDB).
              </span>
            </label>
            {errors.lgpd && (
              <p className="form-error" style={{ marginTop: 8 }}>
                <AlertCircle size={11} />{errors.lgpd.message}
              </p>
            )}
          </div>

          {/* ── Ações ────────────────────────────────────── */}
          <div className="flex justify-end gap-2.5" style={{ paddingTop: 4 }}>
            <Link href="/alunos" className="btn btn-ghost">Cancelar</Link>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting
                ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                : <Save size={14} />
              }
              {isSubmitting ? 'Salvando...' : 'Salvar Aluno'}
            </button>
          </div>
        </form>

      </div>
    </AppShell>
  )
}
