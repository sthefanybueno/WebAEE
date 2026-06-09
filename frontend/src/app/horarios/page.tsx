import { AppShell } from '@/presentation/components/layout/AppShell'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

const GRADE = [
  { hora: '07h30', seg: { nome: 'Artur M.',   ativ: 'Mat. Fina',  tipo: 'normal'    }, ter: { nome: 'CauÃ£ L.',    ativ: 'Conflito!', tipo: 'conflito'  }, qua: { nome: 'Beatriz S.', ativ: 'Leitura',  tipo: 'normal'    }, qui: { nome: 'Enzo G.',    ativ: 'Socializ.', tipo: 'especial'  }, sex: null },
  { hora: '09h00', seg: { nome: 'Daniela V.', ativ: 'Comunic.',  tipo: 'normal'    }, ter: null,                                                        qua: { nome: 'CauÃ£ L.',    ativ: 'Autonomia',tipo: 'normal'    }, qui: null,                                                         sex: { nome: 'Artur M.',   ativ: 'Escrita',  tipo: 'normal'    } },
  { hora: '10h30', seg: null,                                                          ter: { nome: 'Enzo G.',    ativ: 'Leitura',  tipo: 'normal'    }, qua: null,                                                         qui: { nome: 'Beatriz S.', ativ: 'Motor F.', tipo: 'normal'    }, sex: { nome: 'Daniela V.', ativ: 'Escrita',  tipo: 'normal'    } },
]

type Slot = { nome: string; ativ: string; tipo: 'normal' | 'conflito' | 'especial' } | null

function SlotCell({ slot }: { slot: Slot }) {
  if (!slot) return <div className="px-2 py-2 text-center text-[11px] text-[--color-text-secondary] bg-[--color-surface] rounded-xl">Livre</div>
  return (
    <div className={`px-2 py-2 rounded-xl text-center text-[11px] font-bold leading-tight ${
      slot.tipo === 'conflito'  ? 'bg-red-100 text-[--color-status-danger] border border-red-200' :
      slot.tipo === 'especial'  ? 'bg-amber-50 text-[--color-status-warning]' :
      'bg-[--color-primary-light] text-[--color-primary]'
    }`}>
      {slot.nome}<br />
      <span className="font-normal opacity-80">{slot.ativ}</span>
    </div>
  )
}

export default function HorariosPage() {
  return (
    <AppShell
      role="prof_aee"
      header={
        <>
          <Link href="/dashboard" aria-label="Voltar" className="p-2 -ml-2 rounded-full hover:bg-[--color-primary-light] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-[18px] font-bold text-[--color-text-primary]">HorÃ¡rios de Atendimento</h1>
          <div className="w-9" />
        </>
      }
    >
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h2 className="text-[22px] font-bold text-[--color-text-primary]">Agenda Semanal</h2>
          <p className="text-[15px] text-[--color-text-secondary]">Semana de 05 a 09/Mai/2026</p>
        </div>

        {/* Alerta conflito */}
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
          <AlertTriangle size={18} className="text-[--color-status-danger] shrink-0" />
          <p className="text-[15px] font-bold text-[--color-status-danger]">
            âš  Conflito de horÃ¡rio detectado em TerÃ§a-feira
          </p>
        </div>

        {/* Grade */}
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full min-w-[560px] border-collapse">
            <thead>
              <tr>
                <th className="text-left py-3 pr-3 text-[11px] font-bold text-[--color-text-secondary] uppercase tracking-wider w-16">Hora</th>
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].map((d) => (
                  <th key={d} className="py-3 px-1 text-[11px] font-bold text-[--color-text-secondary] uppercase tracking-wider text-center">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GRADE.map((row) => (
                <tr key={row.hora} className="border-t border-[--color-border]">
                  <td className="py-3 pr-3 text-[12px] font-bold text-[--color-text-secondary] align-top pt-4">{row.hora}</td>
                  {[row.seg, row.ter, row.qua, row.qui, row.sex].map((slot, i) => (
                    <td key={i} className="px-1 py-2 align-top"><SlotCell slot={slot as Slot} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap gap-4 pt-2">
          {[
            { cor: 'bg-[--color-primary-light]', label: 'Normal' },
            { cor: 'bg-red-100 border border-red-200', label: 'Conflito' },
            { cor: 'bg-amber-50', label: 'Especial' },
            { cor: 'bg-[--color-surface]', label: 'Livre' },
          ].map(({ cor, label }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-md ${cor}`} />
              <span className="text-[13px] text-[--color-text-secondary]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

