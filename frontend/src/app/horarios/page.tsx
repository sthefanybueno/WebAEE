'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/presentation/components/layout/AppShell'
import { ArrowLeft, AlertTriangle, Plus, Calendar, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { useAlunos } from '@/application/hooks/useAlunos'
import { cn } from '@/presentation/utils/utils'
import { apiClient } from '@/infrastructure/http/client'
import { usePapel } from '@/application/hooks/usePapel'
import { useRouter } from 'next/navigation'

type Slot = { id?: string; aluno_id?: string; nome: string; ativ: string; tipo: 'normal' | 'conflito' | 'especial' } | null

type DiaSemana = 'seg' | 'ter' | 'qua' | 'qui' | 'sex'
type GradeRow = { hora: string } & Record<DiaSemana, Slot>

const DEFAULT_HOURS: string[] = []

function createEmptyGrade(hours: string[]): GradeRow[] {
  return hours.map(h => ({ hora: h, seg: null, ter: null, qua: null, qui: null, sex: null }))
}

function SlotCell({ slot, onClickLivre, onDragStart, onDragOver, onDrop, onDelete }: { 
  slot: Slot, 
  onClickLivre?: () => void,
  onDragStart?: (e: React.DragEvent) => void,
  onDragOver?: (e: React.DragEvent) => void,
  onDrop?: (e: React.DragEvent) => void,
  onDelete?: () => void
}) {
  if (!slot) return (
    <div 
      onClick={onClickLivre}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="px-2 py-3 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 hover:bg-slate-100 hover:text-primary hover:border-primary/40 cursor-pointer transition-all h-full flex items-center justify-center min-h-[48px]"
    >
      Livre
    </div>
  )
  return (
    <div 
      draggable
      onDragStart={onDragStart}
      className={cn("relative group px-2 py-2 rounded-xl text-center text-xs font-bold leading-tight border transition-colors cursor-grab active:cursor-grabbing",
      slot.tipo === 'conflito'  ? 'bg-red-50 text-red-700 border-red-200' :
      slot.tipo === 'especial'  ? 'bg-amber-50 text-amber-700 border-amber-200' :
      'bg-primary-light text-primary border-primary/20'
    )}>
      <span className="block break-words">{slot.nome}</span>
      <span className="font-normal opacity-80 text-[10px] break-words block mt-0.5">{slot.ativ}</span>
      
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Remover aluno deste horário"
      >
        <X size={12} />
      </button>
    </div>
  )
}

export default function HorariosPage() {
  const router = useRouter()
  const usuario = usePapel()
  
  useEffect(() => {
    if (usuario?.papel === 'prof_apoio' || usuario?.papel === 'prof_regente') {
      router.replace('/dashboard')
    }
  }, [usuario, router])

  const { alunos, loading: alunosLoading } = useAlunos()
  
  // Custom hours management
  const [customHours, setCustomHours] = useState<string[]>([])
  const [grade, setGrade] = useState<GradeRow[]>([])
  const [novoHorarioInput, setNovoHorarioInput] = useState('')
  const [showNovoHorario, setShowNovoHorario] = useState(false)
  
  // Modal de Exclusão da Linha
  const [horaToDelete, setHoraToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Drag & Drop e Exclusão de Slot
  const [dragConfirm, setDragConfirm] = useState<{
    sourceSlot: Slot & { dia: DiaSemana, hora: string };
    targetDia: DiaSemana;
    targetHora: string;
  } | null>(null)
  
  const [deleteSlotModal, setDeleteSlotModal] = useState<{
    slotId: string;
    nome: string;
    dia: DiaSemana;
    hora: string;
  } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('aee_custom_hours')
    if (saved) {
      setCustomHours(JSON.parse(saved))
    }
  }, [])

  const allHours = Array.from(new Set([...DEFAULT_HOURS, ...customHours])).sort()

  // Initialize Grade
  useEffect(() => {
    setGrade(createEmptyGrade(allHours))
  }, [allHours.join(',')])
  
  // Form State
  const [showForm, setShowForm] = useState(false)
  const [selectedAluno, setSelectedAluno] = useState('')
  const [selectedDia, setSelectedDia] = useState<DiaSemana>('seg')
  const [selectedHora, setSelectedHora] = useState(allHours[0] || '07h30')
  const [tipoAgendamento, setTipoAgendamento] = useState<'Atendimento' | 'Reunião'>('Atendimento')
  const [descricao, setDescricao] = useState('')
  const [erroConflito, setErroConflito] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState(false)

  const [reloadTrigger, setReloadTrigger] = useState(0)

  const availableHoursByDay = (() => {
    const map: Record<DiaSemana, string[]> = { seg: [], ter: [], qua: [], qui: [], sex: [] }
    if (allHours.length === 0) return map

    allHours.forEach(hora => {
      const row = grade.find(r => r.hora === hora)
      const isAvailable = (dia: DiaSemana) => !row || row[dia] === null;
      
      (['seg', 'ter', 'qua', 'qui', 'sex'] as DiaSemana[]).forEach(dia => {
        if (isAvailable(dia)) {
          map[dia].push(hora)
        }
      })
    })
    return map
  })()

  const availableDays = (['seg', 'ter', 'qua', 'qui', 'sex'] as DiaSemana[]).filter(d => availableHoursByDay[d].length > 0)
  const currentAvailableHours = availableHoursByDay[selectedDia] || []

  // Atualiza o dia selecionado se o atual ficar cheio
  useEffect(() => {
    if (availableDays.length > 0 && !availableDays.includes(selectedDia)) {
      setSelectedDia(availableDays[0])
    }
  }, [availableDays.join(','), selectedDia])

  // Atualiza a hora selecionada se a atual não estiver mais disponível neste dia
  useEffect(() => {
    if (currentAvailableHours.length > 0 && !currentAvailableHours.includes(selectedHora)) {
      setSelectedHora(currentAvailableHours[0])
    }
  }, [currentAvailableHours.join(','), selectedHora])

  // Fetch Agendas
  useEffect(() => {
    async function loadAgendas() {
      try {
        const data = await apiClient.get<any[]>('/api/agendas')
        const apiHours = data.map(a => a.hora)
        const newCustomHours = [...customHours]
        let added = false
        apiHours.forEach(h => {
          if (!DEFAULT_HOURS.includes(h) && !newCustomHours.includes(h)) {
            newCustomHours.push(h)
            added = true
          }
        })
        if (added) {
          setCustomHours(newCustomHours)
          localStorage.setItem('aee_custom_hours', JSON.stringify(newCustomHours))
        }

        const currentAllHours = Array.from(new Set([...DEFAULT_HOURS, ...newCustomHours])).sort()
        const newGrade = createEmptyGrade(currentAllHours)

        data.forEach(agenda => {
          const rowIndex = newGrade.findIndex(r => r.hora === agenda.hora)
          
          let alunoNome = 'Aluno Desconhecido'
          if (agenda.aluno_id === '00000000-0000-0000-0000-000000000000') {
            alunoNome = agenda.atividade || 'Reunião'
          } else {
            alunoNome = alunos.find(a => a.server_id === agenda.aluno_id)?.nome || 'Aluno'
          }
          
          if (rowIndex !== -1 && ['seg', 'ter', 'qua', 'qui', 'sex'].includes(agenda.dia_semana)) {
            newGrade[rowIndex][agenda.dia_semana as DiaSemana] = {
              id: agenda.id,
              aluno_id: agenda.aluno_id,
              nome: alunoNome,
              ativ: agenda.aluno_id === '00000000-0000-0000-0000-000000000000' ? 'Reunião' : agenda.atividade,
              tipo: agenda.tipo_slot
            }
          }
        })
        setGrade(newGrade)
      } catch (err) {
        console.error('Erro ao carregar agendas', err)
      }
    }
    if (alunos.length > 0) {
      loadAgendas()
    }
  }, [alunos, reloadTrigger]) // dependemos do trigger para forçar recarregamento

  const handleDragStart = (e: React.DragEvent, slot: Slot, dia: DiaSemana, hora: string) => {
    if (!slot) return
    e.dataTransfer.setData('application/json', JSON.stringify({ ...slot, dia, hora }))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetDia: DiaSemana, targetHora: string) => {
    e.preventDefault()
    try {
      const data = e.dataTransfer.getData('application/json')
      if (data) {
        const sourceSlot = JSON.parse(data)
        if (sourceSlot.dia === targetDia && sourceSlot.hora === targetHora) return
        setDragConfirm({
          sourceSlot,
          targetDia,
          targetHora
        })
      }
    } catch (err) {
      console.error('Erro no drag and drop:', err)
    }
  }

  async function handleAddSlot(e: React.FormEvent) {
    e.preventDefault()
    setErroConflito(null)

    if (tipoAgendamento === 'Atendimento' && !selectedAluno) {
      setErroConflito('Selecione um aluno.')
      return
    }

    if (tipoAgendamento === 'Reunião' && !descricao.trim()) {
      setErroConflito('Preencha a descrição da reunião.')
      return
    }

    // Validação de conflito
    const row = grade.find(r => r.hora === selectedHora)
    if (row && row[selectedDia] !== null) {
      setErroConflito('Já existe um agendamento neste horário.')
      return
    }

    const rowIndex = grade.findIndex(r => r.hora === selectedHora)
    if (rowIndex === -1) {
      setErroConflito('Você precisa adicionar pelo menos um horário na grade antes de agendar. Clique em "+ Novo Horário".')
      return
    }

    setLoadingAction(true)
    try {
      const payloadAlunoId = tipoAgendamento === 'Reunião' 
        ? '00000000-0000-0000-0000-000000000000' 
        : selectedAluno;
        
      const payloadAtividade = tipoAgendamento === 'Reunião'
        ? descricao
        : tipoAgendamento;

      await apiClient.post('/api/agendas/', {
        aluno_id: payloadAlunoId,
        dia_semana: selectedDia,
        hora: selectedHora,
        atividade: payloadAtividade,
        tipo_slot: tipoAgendamento === 'Reunião' ? 'especial' : 'normal'
      })

      setReloadTrigger(prev => prev + 1)
      setShowForm(false)
      setDescricao('')
      setSelectedAluno('')
    } catch (err: any) {
      setErroConflito(err.response?.data?.detail || 'Erro ao salvar o agendamento.')
    } finally {
      setLoadingAction(false)
    }
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
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowNovoHorario(!showNovoHorario)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl transition-all shadow-sm"
              >
                + Novo Horário
              </button>
              {!showForm && (
                <button 
                  onClick={() => setShowForm(true)}
                  className="xl:hidden inline-flex items-center justify-center gap-2 px-5 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all shadow-sm active:scale-[0.98]"
                >
                  <Plus size={18} />
                  Agendar Aluno
                </button>
              )}
            </div>
          </div>

          {showNovoHorario && (
            <div className="flex items-center gap-3 p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
              <div className="flex-1 max-w-[150px]">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Horário</label>
                <input 
                  type="time"
                  value={novoHorarioInput} 
                  onChange={e => setNovoHorarioInput(e.target.value)} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>
              <div className="flex items-end pb-[2px]">
                <button 
                  onClick={() => {
                    const formattedTime = novoHorarioInput.replace(':', 'h')
                    if (formattedTime && !allHours.includes(formattedTime)) {
                      const n = [...customHours, formattedTime]
                      setCustomHours(n)
                      localStorage.setItem('aee_custom_hours', JSON.stringify(n))
                    }
                    setNovoHorarioInput('')
                    setShowNovoHorario(false)
                  }}
                  disabled={!novoHorarioInput}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-bold rounded-lg shadow-sm transition-colors mt-5"
                >
                  Adicionar
                </button>
              </div>
            </div>
          )}

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
                  {grade.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                        Nenhum horário cadastrado na sua agenda. <br/>Clique em <strong className="text-slate-700">+ Novo Horário</strong> para começar.
                      </td>
                    </tr>
                  )}
                  {grade.map((row) => (
                    <tr key={row.hora} className="hover:bg-slate-50/80 transition-colors duration-150 group">
                      <td className="py-4 px-6 text-sm font-bold text-slate-600 align-middle whitespace-nowrap">
                        <div className="flex items-center justify-between">
                          <span>{row.hora}</span>
                          <button 
                            onClick={() => setHoraToDelete(row.hora)}
                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remover horário"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                      {([
                        { d: 'seg', slot: row.seg },
                        { d: 'ter', slot: row.ter },
                        { d: 'qua', slot: row.qua },
                        { d: 'qui', slot: row.qui },
                        { d: 'sex', slot: row.sex },
                      ] as const).map(({ d, slot }, i) => (
                        <td key={i} className="px-2 py-2 align-middle min-w-[120px]">
                          <SlotCell 
                            slot={slot} 
                            onClickLivre={() => {
                              setSelectedDia(d as DiaSemana)
                              setSelectedHora(row.hora)
                              setShowForm(true)
                            }}
                            onDragStart={(e) => handleDragStart(e, slot, d as DiaSemana, row.hora)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, d as DiaSemana, row.hora)}
                            onDelete={() => {
                              if (slot && slot.id) {
                                setDeleteSlotModal({
                                  slotId: slot.id,
                                  nome: slot.nome,
                                  dia: d as DiaSemana,
                                  hora: row.hora
                                })
                              }
                            }}
                          />
                        </td>
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
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900">Tipo de Agendamento</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="tipoAgendamento" 
                      value="Atendimento"
                      checked={tipoAgendamento === 'Atendimento'}
                      onChange={() => setTipoAgendamento('Atendimento')}
                      className="w-4 h-4 text-primary focus:ring-primary border-slate-300 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Atendimento</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="tipoAgendamento" 
                      value="Reunião"
                      checked={tipoAgendamento === 'Reunião'}
                      onChange={() => setTipoAgendamento('Reunião')}
                      className="w-4 h-4 text-primary focus:ring-primary border-slate-300 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Reunião</span>
                  </label>
                </div>
              </div>

              {tipoAgendamento === 'Atendimento' ? (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900">Aluno</label>
                  <select 
                    value={selectedAluno}
                    onChange={e => setSelectedAluno(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow disabled:bg-slate-50 disabled:text-slate-500 cursor-pointer appearance-none"
                    disabled={alunosLoading}
                  >
                    <option value="">Selecione o aluno...</option>
                    {alunos?.map(a => <option key={a.id} value={a.server_id || String(a.id)}>{a.nome}</option>)}
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900">Descrição da Reunião</label>
                  <input 
                    type="text"
                    placeholder="Ex: Reunião com os pais do João"
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900">Dia</label>
                  <select 
                    value={selectedDia}
                    onChange={e => setSelectedDia(e.target.value as DiaSemana)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow cursor-pointer appearance-none disabled:bg-slate-50 disabled:text-slate-500"
                    disabled={availableDays.length === 0}
                  >
                    {availableDays.length === 0 && <option value="">Nenhum dia disponível</option>}
                    {availableDays.includes('seg') && <option value="seg">Segunda</option>}
                    {availableDays.includes('ter') && <option value="ter">Terça</option>}
                    {availableDays.includes('qua') && <option value="qua">Quarta</option>}
                    {availableDays.includes('qui') && <option value="qui">Quinta</option>}
                    {availableDays.includes('sex') && <option value="sex">Sexta</option>}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-900">Hora</label>
                  <select 
                    value={selectedHora}
                    onChange={e => setSelectedHora(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-shadow cursor-pointer appearance-none disabled:bg-slate-50 disabled:text-slate-500"
                    disabled={currentAvailableHours.length === 0}
                  >
                    {currentAvailableHours.length === 0 && <option value="">Sem horários disponíveis</option>}
                    {currentAvailableHours.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
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

      {/* Delete Confirmation Modal */}
      {horaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600">
                    <Trash2 size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Remover Horário</h3>
                </div>
                <button 
                  onClick={() => setHoraToDelete(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="text-slate-600 space-y-4">
                <p>
                  Tem certeza que deseja remover o horário de <strong className="text-slate-900">{horaToDelete}</strong> da sua agenda?
                </p>
                
                {(() => {
                  const row = grade.find(r => r.hora === horaToDelete)
                  const count = row ? [row.seg, row.ter, row.qua, row.qui, row.sex].filter(s => s !== null).length : 0
                  
                  if (count > 0) {
                    return (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm font-semibold text-red-800 flex items-start gap-3">
                        <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-600" />
                        <span>Atenção: Existem <strong>{count}</strong> alunos agendados nesta linha. Ao confirmar, os agendamentos deles serão <strong>cancelados e excluídos</strong>.</span>
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
              <button 
                onClick={() => setHoraToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  setIsDeleting(true)
                  const row = grade.find(r => r.hora === horaToDelete)
                  if (row) {
                    const slots = [row.seg, row.ter, row.qua, row.qui, row.sex].filter(s => s !== null) as Slot[]
                    for (const slot of slots) {
                       if (slot?.id) {
                         try { await apiClient.delete(`/api/agendas/${slot.id}`) } catch (e) {}
                       }
                    }
                  }
                  const n = customHours.filter(h => h !== horaToDelete)
                  setCustomHours(n)
                  localStorage.setItem('aee_custom_hours', JSON.stringify(n))
                  setReloadTrigger(prev => prev + 1)
                  setHoraToDelete(null)
                  setIsDeleting(false)
                }}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
              >
                {isDeleting ? 'Removendo...' : 'Sim, remover'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Slot Modal */}
      {deleteSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600">
                    <Trash2 size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Remover Aluno</h3>
                </div>
              </div>
              <p className="text-slate-600">
                Tem certeza que deseja remover o agendamento de <strong className="text-slate-900">{deleteSlotModal.nome}</strong> na {deleteSlotModal.dia} às {deleteSlotModal.hora}?
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
              <button 
                onClick={() => setDeleteSlotModal(null)}
                disabled={loadingAction}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  setLoadingAction(true)
                  try {
                    await apiClient.delete(`/api/agendas/${deleteSlotModal.slotId}`)
                    setReloadTrigger(prev => prev + 1)
                    setDeleteSlotModal(null)
                  } catch (e) {
                    console.error('Erro ao deletar slot', e)
                  } finally {
                    setLoadingAction(false)
                  }
                }}
                disabled={loadingAction}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-70"
              >
                {loadingAction ? 'Removendo...' : 'Sim, remover'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drag Confirm Modal */}
      {dragConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600">
                    <Calendar size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Mover Agendamento</h3>
                </div>
              </div>
              <p className="text-slate-600">
                Deseja mover <strong className="text-slate-900">{dragConfirm.sourceSlot.nome}</strong> de <strong className="text-slate-900">{dragConfirm.sourceSlot.dia} às {dragConfirm.sourceSlot.hora}</strong> para <strong className="text-slate-900">{dragConfirm.targetDia} às {dragConfirm.targetHora}</strong>?
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
              <button 
                onClick={() => setDragConfirm(null)}
                disabled={loadingAction}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  setLoadingAction(true)
                  try {
                    if (dragConfirm.sourceSlot.id) {
                      await apiClient.delete(`/api/agendas/${dragConfirm.sourceSlot.id}`)
                    }
                    await apiClient.post('/api/agendas/', {
                      aluno_id: dragConfirm.sourceSlot.aluno_id,
                      dia_semana: dragConfirm.targetDia,
                      hora: dragConfirm.targetHora,
                      atividade: dragConfirm.sourceSlot.ativ,
                      tipo_slot: dragConfirm.sourceSlot.tipo
                    })
                    setReloadTrigger(prev => prev + 1)
                    setDragConfirm(null)
                  } catch (e: any) {
                    alert('Erro ao mover: ' + (e.response?.data?.detail || e.message))
                  } finally {
                    setLoadingAction(false)
                  }
                }}
                disabled={loadingAction}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-70"
              >
                {loadingAction ? 'Movendo...' : 'Sim, mover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
