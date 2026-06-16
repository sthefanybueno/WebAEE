'use client'

/**
 * useNovoAlunoForm — Fat Hook (Application Layer)
 * ================================================
 * Encapsula TODA a lógica do formulário de cadastro de aluno:
 *   - Schema de validação Zod
 *   - Integração com react-hook-form
 *   - Submissão e persistência local (via alunoLocalService)
 *   - Estado de erro visual (sem alert())
 *   - Navegação pós-submissão
 *
 * [Thin Component Pattern] A página `alunos/novo/page.tsx` apenas
 * renderiza o que este hook retorna — zero lógica no componente.
 *
 * [DTO Contract] O payload salvo localmente inclui:
 *   - escola_atual_id: UUID string (chave do backend)
 *   - escola_atual: nome legível (para exibição offline)
 *   - consentimento_lgpd: boolean (exigido pelo backend)
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { salvarAlunoLocal } from '@/application/services/alunoLocalService'
import { useEscolas } from './useEscolas'

// ─── Schema de validação ────────────────────────────────────────────────────

export const novoAlunoSchema = z.object({
  nome: z.string().min(3, 'Nome deve conter pelo menos 3 caracteres'),
  nascimento: z.string().min(1, 'Selecione a data de nascimento'),
  escola_atual_id: z.string().uuid('Selecione uma unidade de ensino válida').min(1, 'Selecione a unidade de ensino'),
  diagnostico: z.string().optional(),
  lgpd: z.literal(true, { message: 'É obrigatório consentir com o termo da LGPD.' }),
})

export type NovoAlunoInput = z.infer<typeof novoAlunoSchema>

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * useNovoAlunoForm
 *
 * Retorna form controls e handlers prontos para serem usados
 * em um Thin Component de apresentação.
 */
export function useNovoAlunoForm() {
  const router = useRouter()
  const [erroGlobal, setErroGlobal] = useState<string | null>(null)
  const { escolas, isLoading: escolasLoading } = useEscolas()

  const form = useForm<NovoAlunoInput>({
    resolver: zodResolver(novoAlunoSchema),
    defaultValues: {
      nome: '',
      nascimento: '',
      escola_atual_id: '',
      diagnostico: '',
    },
  })

  /**
   * onSubmit — persiste aluno localmente com DTO correto e navega para a lista.
   * Erros são capturados e expostos via `erroGlobal` (sem alert()).
   */
  async function onSubmit(data: NovoAlunoInput) {
    setErroGlobal(null)
    try {
      // Resolve o nome da escola pelo UUID selecionado (para exibição offline)
      const escolaSelecionada = escolas.find(e => e.id === data.escola_atual_id)
      const escolaNome = escolaSelecionada?.nome ?? 'Escola não identificada'

      await salvarAlunoLocal({
        nome: data.nome,
        // DTO alinhado com backend (CreateStudentRequest)
        escola_atual_id: data.escola_atual_id,
        escola_atual: escolaNome,
        data_nascimento: data.nascimento,
        diagnostico: data.diagnostico ?? '',
        status: 'ativo',
        consentimento_lgpd: data.lgpd,
      })
      router.push('/alunos')
    } catch (err) {
      console.error('[useNovoAlunoForm] Erro ao salvar aluno localmente:', err)
      setErroGlobal(
        'Não foi possível salvar o aluno. Verifique o armazenamento local e tente novamente.'
      )
    }
  }

  return {
    form,
    erroGlobal,
    escolas,
    escolasLoading,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    errors: form.formState.errors,
    register: form.register,
  }
}
