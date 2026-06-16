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
  if (!slot) return <div className="px-2 py-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">Livre</div>
  return (
    <div className={cn("px-2 py-2 rounded-xl text-center text-xs font-bold leading-tight border transition-colors",
      slot.tipo === 'conflito'  ? 'bg-red-50 text-red-700 border-red-200' :
      slot.tipo === 'especial'  ? 'bg-amber-50 text-amber-700 border-amber-200' :
      'bg-primary-light text-primary border-primary/20'
    )}>
      <span className="block truncate">{slot.nome}</span>
      <span className="font-normal opacity-80 text-[10px] truncate block">{slot.ativ}</span>
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
    const alunoNome = alunos.find(a => String(a.id) === selectedAluno)?.nome || 'Aluno Desconhecido'
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
    <AppShell title="Horários">
      <div className="max-w-6xl mx-auto p-6 lg:p-8 flex flex-col xl:flex-row gap-8 items-start">
        
        {/* Lado Esquerdo: Grade */}
        <div className="flex-1 w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
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
                  Agenda Semanal
                </h2>
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                  <Calendar size={16} /> Horários de Atendimento
                </p>
              </div>
            </div>
            {!showForm && (
              <button 
                onClick={() => setShowForm(true)}
                className="xl:hidden inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]"
              >
                <Plus size={18} />
                Agendar Aluno
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200">
                    <th className="text-left py-4 px-6 text-[11px] font-bold text-slate-500 uppercase tracking-wider w-24">Hora</th>
                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].map((d) => (
                      <th key={d} className="py-4 px-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center w-1/5">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grade.map((row) => (
                    <tr key={row.hora} className="hover:bg-slate-50/80 transition-colors duration-150">
                      <td className="py-4 px-6 text-sm font-bold text-slate-600 align-middle whitespace-nowrap">{row.hora}</td>
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
              { cor: 'bg-primary-light border-primary/20', label: 'Normal' },
              { cor: 'bg-red-50 border-red-200', label: 'Conflito' },
              { cor: 'bg-amber-50 border-amber-200', label: 'Especial' },
              { cor: 'bg-slate-50 border-slate-200 border-dashed', label: 'Livre' },
            ].map(({ cor, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-md border ${cor}`} />
                <span className="text-xs font-semibold text-slate-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lado Direito: Formulário de Agendamento */}
        <div className={cn(
          "w-full xl:w-[320px] shrink-0",
          !showForm && "hidden xl:block"
        )}>
          <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-6 sticky top-24">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Plus size={20} className="text-primary" />
              Agendar Atendimento
            </h3>

            {erroConflito && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
                <AlertTriangle size={18} className="text-red-600 shrink-0" />
                <p className="text-sm font-semibold text-red-800 leading-snug">{erroConflito}</p>
              </div>
            )}

            <form onSubmit={handleAddSlot} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">Aluno</label>
                <select 
                  value={selectedAluno}
                  onChange={e => setSelectedAluno(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow disabled:bg-slate-50 disabled:text-slate-500 cursor-pointer appearance-none"
                  disabled={alunosLoading}
                >
                  <option value="">Selecione o aluno...</option>
                  {alunos?.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900">Dia</label>
                  <select 
                    value={selectedDia}
                    onChange={e => setSelectedDia(e.target.value as DiaSemana)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow cursor-pointer appearance-none"
                  >
                    <option value="seg">Segunda</option>
                    <option value="ter">Terça</option>
                    <option value="qua">Quarta</option>
                    <option value="qui">Quinta</option>
                    <option value="sex">Sexta</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900">Hora</label>
                  <select 
                    value={selectedHora}
                    onChange={e => setSelectedHora(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow cursor-pointer appearance-none"
                  >
                    {INITIAL_GRADE.map(r => <option key={r.hora} value={r.hora}>{r.hora}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-900">Atividade</label>
                <input 
                  type="text"
                  placeholder="Ex: Motor Fino"
                  value={atividade}
                  onChange={e => setAtividade(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => { setShowForm(false); setErroConflito(null); }}
                  className="xl:hidden flex-1 py-2.5 flex items-center justify-center font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-[2] py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]"
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
