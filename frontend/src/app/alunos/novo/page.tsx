'use client'

import { AppShell } from '@/presentation/components/layout/AppShell'
import { ArrowLeft, Save, Info, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { salvarAlunoLocal } from '@/application/hooks/useAlunos'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const novoAlunoSchema = z.object({
  nome: z.string().min(3, 'Nome deve conter pelo menos 3 caracteres'),
  nascimento: z.string().min(1, 'Selecione a data de nascimento'),
  escola_atual: z.string().min(1, 'Selecione a unidade de ensino'),
  diagnostico: z.string().optional(),
  lgpd: z.literal(true, { message: 'Ã‰ obrigatÃ³rio consentir com o termo da LGPD.' }),
})

type NovoAlunoInput = z.infer<typeof novoAlunoSchema>

export default function NovoAlunoPage() {
  const router = useRouter()
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NovoAlunoInput>({
    resolver: zodResolver(novoAlunoSchema),
    defaultValues: {
      nome: '',
      nascimento: '',
      escola_atual: '',
      diagnostico: '',
    },
  })

  async function onSubmit(data: NovoAlunoInput) {
    try {
      await salvarAlunoLocal({
        nome: data.nome,
        escola_atual: data.escola_atual,
        data_nascimento: data.nascimento,
        diagnostico: data.diagnostico || '',
        status: 'ativo'
      })
      router.push('/alunos')
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar aluno localmente.')
    }
  }

  return (
    <AppShell title="Novo Aluno">
      <div className="max-w-[760px] mx-auto py-8 px-7">

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-7">
          <Link
            href="/alunos"
            className="w-9 h-9 rounded-lg border border-[--color-border] flex items-center justify-center text-[--color-text-secondary] bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={17} />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-[--color-text-primary]">Novo Aluno</h2>
            <p className="text-[13px] text-[--color-text-secondary] mt-0.5">
              Preencha as informaÃ§Ãµes para iniciar o acompanhamento especializado.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} id="form-novo-aluno" className="space-y-5">

          {/* Card: Dados Pessoais */}
          <div className="card overflow-hidden">
            <div className="py-3.5 px-5 border-b border-[--color-border] bg-gray-50">
              <p className="text-[13.5px] font-bold text-[--color-text-primary]">Dados Pessoais</p>
              <p className="text-[12px] text-[--color-text-secondary] mt-0.5">InformaÃ§Ãµes bÃ¡sicas de identificaÃ§Ã£o.</p>
            </div>
            <div className="p-5 grid gap-4 grid-cols-1 md:grid-cols-2">
              <div className="col-span-full">
                <label htmlFor="nome" className="form-label">Nome Completo *</label>
                <input
                  id="nome"
                  type="text"
                  placeholder="Ex: JoÃ£o da Silva Santos"
                  className={`form-input ${errors.nome ? 'border-red-500 focus:border-red-500 focus:box-shadow-none' : ''}`}
                  {...register('nome')}
                />
                {errors.nome && (
                  <span className="text-xs text-red-500 mt-1 block font-medium">{errors.nome.message}</span>
                )}
              </div>
              
              <div>
                <label htmlFor="nascimento" className="form-label">Data de Nascimento *</label>
                <input
                  id="nascimento"
                  type="date"
                  className={`form-input ${errors.nascimento ? 'border-red-500 focus:border-red-500' : ''}`}
                  {...register('nascimento')}
                />
                {errors.nascimento && (
                  <span className="text-xs text-red-500 mt-1 block font-medium">{errors.nascimento.message}</span>
                )}
              </div>
              
              <div>
                <label htmlFor="escola_atual" className="form-label">Escola Vinculada *</label>
                <select
                  id="escola_atual"
                  className={`form-input cursor-pointer ${errors.escola_atual ? 'border-red-500 focus:border-red-500' : ''}`}
                  {...register('escola_atual')}
                >
                  <option value="">Selecione a unidade</option>
                  <option value="E.E. Castelo Branco">E.E. Castelo Branco</option>
                  <option value="E.M. Flores do Campo">E.M. Flores do Campo</option>
                  <option value="E.M. Primavera">E.M. Primavera</option>
                </select>
                {errors.escola_atual && (
                  <span className="text-xs text-red-500 mt-1 block font-medium">{errors.escola_atual.message}</span>
                )}
              </div>
            </div>
          </div>

          {/* Card: InformaÃ§Ãµes ClÃ­nicas */}
          <div className="card overflow-hidden">
            <div className="py-3.5 px-5 border-b border-[--color-border] bg-gray-50">
              <p className="text-[13.5px] font-bold text-[--color-text-primary]">InformaÃ§Ãµes ClÃ­nicas</p>
              <p className="text-[12px] text-[--color-text-secondary] mt-0.5">Dados sensÃ­veis â€” acesso auditado conforme LGPD Art. 58 LDB.</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label htmlFor="diagnostico" className="form-label">Laudo / DiagnÃ³stico Principal</label>
                <textarea
                  id="diagnostico"
                  rows={4}
                  placeholder="Descreva as principais caracterÃ­sticas clÃ­nicas e pedagÃ³gicas..."
                  className="form-input min-h-[90px] resize-vertical"
                  {...register('diagnostico')}
                />
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-[--color-text-secondary]">
                  <Info size={12} /> Campo sensÃ­vel â€” visÃ­vel apenas para profissionais autorizados.
                </p>
              </div>
            </div>
          </div>

          {/* LGPD */}
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 w-4 h-4 accent-[#1A6F45] cursor-pointer shrink-0"
                {...register('lgpd')}
              />
              <span className="text-[13px] text-[#1E40AF] leading-relaxed">
                Confirmo que obtive o <strong>consentimento LGPD</strong> do responsÃ¡vel legal para
                registro e tratamento dos dados deste estudante (base legal: Art. 58 LDB).
              </span>
            </label>
            {errors.lgpd && (
              <span className="text-xs text-red-500 mt-2 block font-semibold">{errors.lgpd.message}</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5">
            <Link href="/alunos" className="btn-ghost">Cancelar</Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Save size={15} />
              )}
              {isSubmitting ? 'Salvando...' : 'Salvar Aluno'}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  )
}

