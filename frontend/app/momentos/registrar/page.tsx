'use client'

import { useState, useRef } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { ArrowLeft, Camera, ImagePlus, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn, getInitials } from '@/lib/utils'
import { useAlunos } from '@/hooks/useAlunos'
import { db } from '@/lib/db'

type Tag = 'autonomia' | 'comunicacao' | 'motor_fino' | 'socializacao' | 'outro'

const TAGS: { value: Tag; label: string; emoji: string }[] = [
  { value: 'autonomia',    label: 'Autonomia',    emoji: '🎯' },
  { value: 'comunicacao',  label: 'Comunicação',  emoji: '💬' },
  { value: 'motor_fino',   label: 'Motor Fino',   emoji: '✋' },
  { value: 'socializacao', label: 'Socialização', emoji: '🤝' },
  { value: 'outro',        label: 'Outro',        emoji: '📝' },
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
  const fileRef = useRef<HTMLInputElement>(null)

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setTimeout(() => setStep(2), 400)
  }

  function handleSelectAluno(id: string) {
    setAlunoId(id)
    setTimeout(() => setStep(3), 300)
  }

  async function handleSalvar() {
    if (!tag || !alunoId || !selectedFile) { 
      alert('Preencha todos os passos (foto, aluno e tag).')
      return 
    }
    
    setSaving(true)
    try {
      const agora = new Date().toISOString()
      
      // 1. Salva foto como Blob no Dexie
      const fotoId = await db.fotos.add({
        aluno_id: parseInt(alunoId),
        blob: selectedFile,
        sync_status: 'pending',
        updated_at: agora
      })

      // 2. Cria registro na fila de sync
      await db.sync_queue.add({
        entidade: 'foto',
        operacao: 'create',
        payload: { aluno_id: alunoId, tag, local_foto_id: fotoId },
        prioridade: 2, // Fotos tem prioridade menor que relatórios
        criado_em: agora
      })

      router.push('/dashboard')
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar momento localmente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell
      role="prof_aee"
      hideNav
      header={
        <>
          <Link href="/dashboard" aria-label="Voltar" className="p-2 -ml-2 rounded-full hover:bg-[--color-primary-light]">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-[18px] font-bold text-[--color-text-primary]">Registrar Momento</h1>
          <span className="text-[13px] font-bold text-[--color-primary]">{step}/3</span>
        </>
      }
    >
      <div className="flex gap-1 px-4 -mt-1 mb-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className={cn("h-1 flex-1 rounded-full transition-all duration-500", s <= step ? 'bg-[--color-primary]' : 'bg-[--color-border]')} />
        ))}
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[22px] font-bold text-[--color-text-primary]">Selecione a foto</h2>
              <p className="text-[15px] text-[--color-text-secondary]">Capture ou escolha da galeria.</p>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-video rounded-2xl border-2 border-dashed border-[--color-border] flex flex-col items-center justify-center gap-3 hover:border-[--color-primary] hover:bg-[--color-primary-light]/20 transition-all overflow-hidden"
            >
              {previewUrl
                ? <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                : <>
                    <Camera size={40} className="text-[--color-text-secondary]" />
                    <p className="text-[15px] font-bold text-[--color-text-secondary]">Toque para adicionar foto</p>
                  </>
              }
            </button>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => fileRef.current?.click()}
                className="min-h-[48px] flex items-center justify-center gap-2 border border-[--color-border] rounded-xl font-bold text-[--color-text-primary] hover:bg-[--color-surface] transition-colors">
                <Camera size={18} /> Câmera
              </button>
              <button onClick={() => fileRef.current?.click()}
                className="min-h-[48px] flex items-center justify-center gap-2 border border-[--color-border] rounded-xl font-bold text-[--color-text-primary] hover:bg-[--color-surface] transition-colors">
                <ImagePlus size={18} /> Galeria
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[22px] font-bold text-[--color-text-primary]">Para qual aluno?</h2>
              <p className="text-[15px] text-[--color-text-secondary]">Selecione o estudante deste momento.</p>
            </div>
            <div className="relative">
              <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar aluno..." autoFocus
                className="w-full min-h-[48px] px-4 rounded-xl border border-[--color-border] bg-[--color-surface] outline-none focus:border-[--color-primary] transition-colors text-[15px]" />
              {loadingAlunos && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[--color-primary]" size={18} />}
            </div>
            <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto">
              {(alunos || []).filter(a => a.nome.toLowerCase().includes(busca.toLowerCase())).map((a) => (
                <button key={a.id} onClick={() => handleSelectAluno(a.id!.toString())}
                  className={cn('w-full flex items-center gap-4 p-4 bg-[--color-surface-card] rounded-2xl border text-left transition-all hover:border-[--color-primary]/40',
                    alunoId === a.id?.toString() ? 'border-[--color-primary] bg-[--color-primary-light]' : 'border-[--color-border]')}>
                  <div className="w-10 h-10 rounded-full bg-[--color-primary-light] flex items-center justify-center text-[--color-primary] font-bold text-sm shrink-0">
                    {getInitials(a.nome)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[--color-text-primary] truncate">{a.nome}</p>
                    <p className="text-[13px] text-[--color-text-secondary] truncate">{a.escola}</p>
                  </div>
                  {alunoId === a.id?.toString() && <Check size={18} className="ml-auto text-[--color-primary] shrink-0" />}
                </button>
              ))}
              {!loadingAlunos && (alunos || []).length === 0 && (
                <div className="p-8 text-center text-[--color-text-secondary]">
                  Nenhum aluno cadastrado.
                  <Link href="/alunos/novo" className="block text-[--color-primary] font-bold mt-2 underline">Cadastrar aluno</Link>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-[22px] font-bold text-[--color-text-primary]">Qual é o contexto?</h2>
              <p className="text-[15px] text-[--color-text-secondary]">Selecione a área pedagógica deste momento.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {TAGS.map((t) => (
                <button key={t.value} onClick={() => setTag(t.value)}
                  className={cn('min-h-[56px] flex items-center justify-center gap-2 font-bold rounded-xl border transition-all',
                    tag === t.value
                      ? 'bg-[--color-primary] text-white border-transparent shadow-md'
                      : 'bg-[--color-surface-card] text-[--color-text-primary] border-[--color-border] hover:border-[--color-primary]/40',
                    t.value === 'outro' ? 'col-span-2' : ''
                  )}>
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 min-h-[48px] border border-[--color-border] text-[--color-text-secondary] font-bold rounded-xl hover:bg-[--color-surface] transition-colors">
              Anterior
            </button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={step === 1 && !previewUrl}
              className="flex-[2] min-h-[48px] bg-[--color-primary] hover:bg-[--color-primary-hover] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-40">
              Próximo →
            </button>
          ) : (
            <button onClick={handleSalvar} disabled={!tag || saving}
              className="flex-[2] min-h-[48px] bg-[--color-primary] hover:bg-[--color-primary-hover] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-40">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              {saving ? 'Salvando...' : 'Salvar e Fechar'}
            </button>
          )}
        </div>
      </div>
    </AppShell>
  )
}
