'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { atualizarAlunoLocal } from '@/application/services/alunoLocalService'
import { useEscolas } from './useEscolas'
import { useAluno } from './useAlunos'
import { apiClient } from '@/infrastructure/http/client'

export const editarAlunoSchema = z.object({
  nome: z.string().min(3, 'Nome deve conter pelo menos 3 caracteres'),
  nascimento: z.string().min(1, 'Selecione a data de nascimento'),
  escola_atual_id: z.string().min(1, 'Selecione a unidade de ensino'),
  diagnostico: z.string().optional(),
  apoio_id: z.string().optional(),
})

export type EditarAlunoInput = z.infer<typeof editarAlunoSchema>

export function useEditarAlunoForm(id: string) {
  const router = useRouter()
  const [erroGlobal, setErroGlobal] = useState<string | null>(null)
  const { escolas, isLoading: escolasLoading } = useEscolas()
  const { aluno, loading: alunoLoading } = useAluno(id)

  const form = useForm<EditarAlunoInput>({
    resolver: zodResolver(editarAlunoSchema),
    defaultValues: {
      nome: '',
      nascimento: '',
      escola_atual_id: '',
      diagnostico: '',
      apoio_id: '',
    },
  })

  const [professoresApoio, setProfessoresApoio] = useState<{id: string, nome: string}[]>([])
  const [professoresLoading, setProfessoresLoading] = useState(false)
  const escolaIdSelecionada = form.watch('escola_atual_id')

  useEffect(() => {
    if (!escolaIdSelecionada) {
      setProfessoresApoio([])
      return
    }

    async function fetchProfessoresApoio() {
      setProfessoresLoading(true)
      try {
        const result = await apiClient.get<any>('/api/usuarios/')
        const profsApoio = (result?.items || []).filter((u: any) => 
          u.papel === 'prof_apoio' && u.escola_id === escolaIdSelecionada
        )
        setProfessoresApoio(profsApoio)
      } catch (err) {
        console.error('Erro ao buscar professores de apoio', err)
      } finally {
        setProfessoresLoading(false)
      }
    }
    
    fetchProfessoresApoio()
  }, [escolaIdSelecionada])

  // Popula o form quando o aluno é carregado e as escolas estiverem disponíveis
  useEffect(() => {
    if (aluno && escolas.length > 0) {
      let resolvedEscolaId = aluno.escola_atual_id || ''

      // Se não tem ID mas tem nome, tenta achar pelo nome na lista
      if (!resolvedEscolaId && aluno.escola_atual) {
        const encontrada = escolas.find(e => e.nome === aluno.escola_atual)
        if (encontrada) {
          resolvedEscolaId = encontrada.id
        }
      }

      form.reset({
        nome: aluno.nome,
        nascimento: aluno.data_nascimento || '',
        escola_atual_id: resolvedEscolaId,
        diagnostico: aluno.diagnostico || '',
        apoio_id: (aluno as any).apoio_id || '',
      })
    }
  }, [aluno, escolas, form])

  async function onSubmit(data: EditarAlunoInput) {
    if (!aluno?.id) return

    setErroGlobal(null)
    try {
      const escolaSelecionada = escolas.find(e => e.id === data.escola_atual_id)
      const escolaNome = escolaSelecionada?.nome ?? 'Escola não identificada'

      await atualizarAlunoLocal(aluno.id as number, {
        nome: data.nome,
        escola_atual_id: data.escola_atual_id,
        escola_atual: escolaNome,
        data_nascimento: data.nascimento,
        diagnostico: data.diagnostico ?? '',
        apoio_id: data.apoio_id || null,
      })
      router.push(`/alunos/${id}`)
    } catch (err) {
      console.error('[useEditarAlunoForm] Erro ao atualizar aluno localmente:', err)
      setErroGlobal(
        'Não foi possível atualizar o aluno. Verifique o armazenamento local e tente novamente.'
      )
    }
  }

  return {
    form,
    erroGlobal,
    escolas,
    escolasLoading,
    alunoLoading,
    professoresApoio,
    professoresLoading,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    errors: form.formState.errors,
    register: form.register,
  }
}
