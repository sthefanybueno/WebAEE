'use client'

import { useState } from 'react'
import { AppShell } from '@/presentation/components/layout/AppShell'
import { ArrowLeft, AlertTriangle, Plus, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useAlunos } from '@/application/hooks/useAlunos'
import { cn } from '@/presentation/utils/utils'

type Slot = { nome: string; ativ: string; tipo: 'normal' | 'conflito' | 'especial' } | null

type DiaSemana = 'seg' | 'ter' | 'qua' | 'qui' | 'sex'
type GradeRow = { hora: string } & Record<DiaSemana, Slot>

const INITIAL_GRADE: GradeRow[] = [
  { hora: '07h30', seg: null, ter: null, qua: null, qui: null, sex: null },
  { hora: '09h00', seg: null, ter: null, qua: null, qui: null, sex: null },
  { hora: '10h30', seg: null, ter: null, qua: null, qui: null, sex: null },
  { hora: '13h30', seg: null, ter: null, qua: null, qui: null, sex: null },
  { hora: '15h00', seg: null, ter: null, qua: null, qui: null, sex: null },
]

function SlotCell({ slot }: { slot: Slot }) {
  if (!slot) return <div className="px-2 py-3 text-center text-[12px] text-[--color-text-secondary] bg-[--color-surface] rounded-xl border border-transparent border-dashed">Livre</div>
  return (
    <div className={cn("px-2 py-2 rounded-xl text-center text-[12px] font-bold leading-tight border transition-colors",
      slot.tipo === 'conflito'  ? 'bg-red-50 text-red-700 border-red-200' :
      slot.tipo === 'especial'  ? 'bg-amber-50 text-amber-700 border-amber-200' :
      'bg-[--color-primary-light] text-[--color-primary] border-[--color-primary]/20'
    )}>
      <span className="block truncate">{slot.nome}</span>
      <span className="font-normal opacity-80 text-[11px] truncate block">{slot.ativ}</span>
    </div>
  )
}

export default function HorariosPage() {
  const { alunos, loading: alunosLoading } = useAlunos()
  const [grade, setGrade] = useState<GradeRow[]>(INITIAL_GRADE)
  
  // Form State
  const [showForm, setShowForm] = useState(false)
  const [selectedAluno, setSelectedAluno] = useState('')
  const [selectedDia, setSelectedDia] = useState<DiaSemana>('seg')
  const [selectedHora, setSelectedHora] = useState('07h30')
  const [atividade, setAtividade] = useState('')
  const [erroConflito, setErroConflito] = useState<string | null>(null)

  function handleAddSlot(e: React.FormEvent) {
    e.preventDefault()
    setErroConflito(null)

    if (!selectedAluno || !atividade) {
      setErroConflito('Preencha o aluno e a atividade.')
      return
    }

    // Verificar Conflito
    const rowIndex = grade.findIndex(r => r.hora === selectedHora)
    if (rowIndex === -1) return

    const slotAtual = grade[rowIndex][selectedDia]
    if (slotAtual !== null) {
      setErroConflito(`Conflito! O horário de ${selectedDia} às ${selectedHora} já está ocupado por ${slotAtual.nome}.`)
      return
    }

    // Adicionar na grade
    const alunoNome = alunos.find(a => a.id === selectedAluno)?.nome || 'Aluno Desconhecido'
    const newGrade = [...grade]
    newGrade[rowIndex] = {
      ...newGrade[rowIndex],
      [selectedDia]: { nome: alunoNome, ativ: atividade, tipo: 'normal' }
    }
    setGrade(newGrade)
    setShowForm(false)
    setAtividade('')
    setSelectedAluno('')
  }

  return (
    <AppShell
      title="Horários"
      header={
        <>
          <Link href="/dashboard" aria-label="Voltar" className="p-2 -ml-2 rounded-full hover:bg-[--color-primary-light] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-[18px] font-bold text-[--color-text-primary]">Horários de Atendimento</h1>
          <div className="w-9" />
        </>
      }
    >
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col xl:flex-row gap-6 items-start">
        
        {/* Lado Esquerdo: Grade */}
        <div className="flex-1 w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[--color-text-primary]">Agenda Semanal</h2>
              <p className="text-[14px] text-[--color-text-secondary] mt-1 flex items-center gap-2">
                <Calendar size={16} /> Semana Atual
              </p>
            </div>
            {!showForm && (
              <button 
                onClick={() => setShowForm(true)}
                className="xl:hidden inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[--color-primary] hover:bg-[--color-primary-hover] text-white font-bold rounded-xl transition-colors shadow-sm"
              >
                <Plus size={18} />
                Agendar Aluno
              </button>
            )}
          </div>

          <div className="bg-white border border-[--color-border] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse">
                <thead>
                  <tr className="bg-[--color-surface] border-b border-[--color-border]">
                    <th className="text-left py-4 px-4 text-[12px] font-bold text-[--color-text-secondary] uppercase tracking-wider w-20">Hora</th>
                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].map((d) => (
                      <th key={d} className="py-4 px-2 text-[12px] font-bold text-[--color-text-secondary] uppercase tracking-wider text-center w-1/5">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[--color-border]">
                  {grade.map((row) => (
                    <tr key={row.hora} className="hover:bg-[--color-surface] transition-colors">
                      <td className="py-4 px-4 text-[13px] font-bold text-[--color-text-secondary] align-middle">{row.hora}</td>
                      {[row.seg, row.ter, row.qua, row.qui, row.sex].map((slot, i) => (
                        <td key={i} className="px-2 py-2 align-middle"><SlotCell slot={slot} /></td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 px-2">
            {[
              { cor: 'bg-[--color-primary-light] border-[--color-primary]/20', label: 'Normal' },
              { cor: 'bg-red-50 border-red-200', label: 'Conflito' },
              { cor: 'bg-amber-50 border-amber-200', label: 'Especial' },
              { cor: 'bg-[--color-surface] border-transparent border-dashed', label: 'Livre' },
            ].map(({ cor, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-md border ${cor}`} />
                <span className="text-[13px] font-medium text-[--color-text-secondary]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lado Direito: Formulário de Agendamento */}
        <div className={cn(
          "w-full xl:w-80 shrink-0",
          !showForm && "hidden xl:block"
        )}>
          <div className="bg-white border border-[--color-border] rounded-2xl shadow-sm p-5 sticky top-24">
            <h3 className="text-[16px] font-bold text-[--color-text-primary] mb-4 flex items-center gap-2">
              <Plus size={18} className="text-[--color-primary]" />
              Agendar Atendimento
            </h3>

            {erroConflito && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <AlertTriangle size={16} className="text-red-600 mt-0.5 shrink-0" />
                <p className="text-[13px] font-semibold text-red-800">{erroConflito}</p>
              </div>
            )}

            <form onSubmit={handleAddSlot} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[--color-text-primary]">Aluno</label>
                <select 
                  value={selectedAluno}
                  onChange={e => setSelectedAluno(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-[--color-border] bg-[--color-surface] outline-none focus:border-[--color-primary] text-[14px]"
                  disabled={alunosLoading}
                >
                  <option value="">Selecione...</option>
                  {alunos?.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[--color-text-primary]">Dia</label>
                  <select 
                    value={selectedDia}
                    onChange={e => setSelectedDia(e.target.value as DiaSemana)}
                    className="w-full h-11 px-3 rounded-xl border border-[--color-border] bg-[--color-surface] outline-none focus:border-[--color-primary] text-[14px]"
                  >
                    <option value="seg">Segunda</option>
                    <option value="ter">Terça</option>
                    <option value="qua">Quarta</option>
                    <option value="qui">Quinta</option>
                    <option value="sex">Sexta</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-[--color-text-primary]">Hora</label>
                  <select 
                    value={selectedHora}
                    onChange={e => setSelectedHora(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-[--color-border] bg-[--color-surface] outline-none focus:border-[--color-primary] text-[14px]"
                  >
                    {INITIAL_GRADE.map(r => <option key={r.hora} value={r.hora}>{r.hora}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[--color-text-primary]">Atividade</label>
                <input 
                  type="text"
                  placeholder="Ex: Motor Fino"
                  value={atividade}
                  onChange={e => setAtividade(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-[--color-border] bg-[--color-surface] outline-none focus:border-[--color-primary] text-[14px]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button 
                  type="button" 
                  onClick={() => { setShowForm(false); setErroConflito(null); }}
                  className="xl:hidden flex-1 h-11 flex items-center justify-center font-bold text-[--color-text-secondary] border border-[--color-border] rounded-xl"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-[2] h-11 bg-[--color-primary] hover:bg-[--color-primary-hover] text-white font-bold rounded-xl transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </AppShell>
  )
}
