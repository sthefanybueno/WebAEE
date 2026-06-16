'use client'

import { useState, useRef } from 'react'
import { AppShell } from '@/presentation/components/layout/AppShell'
import { ArrowLeft, Camera, ImagePlus, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn, getInitials } from '@/presentation/utils/utils'
import { useAlunos } from '@/application/hooks/useAlunos'
import { salvarFotoLocal } from '@/application/services/fotoLocalService'
import { useEffect } from 'react'

type Tag = 'autonomia' | 'comunicacao' | 'motor_fino' | 'socializacao' | 'outro'

const TAGS: { value: Tag; label: string; emoji: string }[] = [
  { value: 'autonomia',    label: 'Autonomia',    emoji: '🎯' },
  { value: 'comunicacao',  label: 'Comunicação',  emoji: '💬' },
  { value: 'motor_fino',   label: 'Motor Fino',   emoji: '✋' },
  { value: 'socializacao', label: 'Socialização', emoji: '🤝' },
  { value: 'outro',        label: 'Outro',        emoji: '📌' },
]

export default function RegistrarMomentoPage() {
  const router = useRouter()
  const { alunos, loading: loadingAlunos } = useAlunos()
  const [step, setStep] = useState(1)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [alunoId, setAlunoId] = useState('')
  const [tag, setTag] = useState<Tag | null>(null)
  const [saving, setSaving] = useState(false)
  const [busca, setBusca] = useState('')
  const [erroGlobal, setErroGlobal] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const searchParams = useSearchParams()
  const prefilledAlunoId = searchParams.get('aluno_id')

  useEffect(() => {
    if (prefilledAlunoId) {
      setAlunoId(prefilledAlunoId)
    }
  }, [prefilledAlunoId])

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    
    // Skip step 2 if student is already pre-filled
    if (alunoId || prefilledAlunoId) {
      setTimeout(() => setStep(3), 400)
    } else {
      setTimeout(() => setStep(2), 400)
    }
  }

  function handleSelectAluno(id: string) {
    setAlunoId(id)
    setTimeout(() => setStep(3), 300)
  }

  async function handleSalvar() {
    setErroGlobal(null)
    if (!tag || !alunoId || !selectedFile) {
      setErroGlobal('Preencha todos os passos: foto, aluno e contexto pedagógico.')
      return
    }

    setSaving(true)
    try {
      const numAlunoId = parseInt(alunoId)
      if (isNaN(numAlunoId)) {
        throw new Error('ID do aluno inválido.')
      }
      await salvarFotoLocal(numAlunoId, selectedFile, tag)
      router.push('/dashboard')
    } catch (err) {
      console.error('[handleSalvar] Erro ao salvar momento localmente:', err)
      setErroGlobal('Não foi possível salvar o momento. Verifique o armazenamento local e tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell title="Registrar Momento">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 lg:py-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
              aria-label="Voltar"
            >
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-tight">
              Registrar Momento
            </h1>
          </div>
          <span className="text-sm font-bold text-primary bg-primary-light/50 px-3 py-1 rounded-full">{step}/3</span>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1">
          {[1, 2, 3].map((s) => (
            <div key={s} className={cn("h-1.5 flex-1 rounded-full transition-all duration-500", s <= step ? 'bg-primary' : 'bg-slate-200')} />
          ))}
        </div>

        {/* Erro global */}
        {erroGlobal && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <span className="text-red-600 shrink-0 text-sm mt-0.5">⚠️</span>
            <p className="text-sm font-semibold text-red-800 leading-snug">{erroGlobal}</p>
          </div>
        )}

        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-5 sm:p-8">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Selecione a foto</h2>
                <p className="text-sm text-slate-500 mt-1">Capture ou escolha da galeria.</p>
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full aspect-video rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-primary-light/10 transition-all overflow-hidden cursor-pointer"
              >
                {previewUrl
                  ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  : <>
                      <Camera size={40} className="text-slate-400" />
                      <p className="text-sm font-semibold text-slate-500">Toque para adicionar foto</p>
                    </>
                }
              </button>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button onClick={() => fileRef.current?.click()}
                  className="py-3 flex items-center justify-center gap-2 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm active:scale-[0.98]">
                  <Camera size={18} /> Câmera
                </button>
                <button onClick={() => fileRef.current?.click()}
                  className="py-3 flex items-center justify-center gap-2 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm active:scale-[0.98]">
                  <ImagePlus size={18} /> Galeria
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Para qual aluno?</h2>
                <p className="text-sm text-slate-500 mt-1">Selecione o estudante deste momento.</p>
              </div>
              <div className="relative">
                <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar aluno..." autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow text-sm" />
                {loadingAlunos && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-primary" size={18} />}
              </div>
              <div className="flex flex-col gap-2.5 max-h-[40vh] overflow-y-auto pr-1 pb-1">
                {(alunos || []).filter(a => a.nome.toLowerCase().includes(busca.toLowerCase())).map((a) => (
                  <button key={a.id} onClick={() => handleSelectAluno(a.id!.toString())}
                    className={cn('w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:border-primary/40 active:scale-[0.99]',
                      alunoId === a.id?.toString() ? 'border-primary bg-primary-light shadow-sm' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50')}>
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {getInitials(a.nome)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">{a.nome}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{a.escola_atual}</p>
                    </div>
                    {alunoId === a.id?.toString() && <Check size={20} className="ml-auto text-primary shrink-0" />}
                  </button>
                ))}
                {!loadingAlunos && (alunos || []).length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    Nenhum aluno encontrado.
                    <Link href="/alunos/novo" className="block text-primary font-bold mt-3 hover:underline">Cadastrar aluno</Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Qual é o contexto?</h2>
                <p className="text-sm text-slate-500 mt-1">Selecione a área pedagógica deste momento.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {TAGS.map((t) => (
                  <button key={t.value} onClick={() => setTag(t.value)}
                    className={cn('py-4 px-3 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 font-semibold text-sm rounded-xl border transition-all active:scale-[0.98]',
                      tag === t.value
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-primary/40 hover:bg-slate-50',
                      t.value === 'outro' ? 'col-span-2' : ''
                    )}>
                    <span className="text-xl sm:text-lg leading-none">{t.emoji}</span> 
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-8 mt-4 border-t border-slate-100">
            {step > 1 && (
              <button onClick={() => setStep(s => (s === 3 && (alunoId || prefilledAlunoId) && prefilledAlunoId === alunoId) ? 1 : s - 1)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm active:scale-[0.98]">
                Anterior
              </button>
            )}
            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={step === 1 && !previewUrl}
                className="flex-[2] py-3 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100">
                Próximo →
              </button>
            ) : (
              <button onClick={handleSalvar} disabled={!tag || saving}
                className="flex-[2] py-3 bg-primary hover:bg-primary-hover text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100">
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                {saving ? 'Salvando...' : 'Salvar e Fechar'}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
