'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAlunos } from './useAlunos'
import { db } from '@/infrastructure/db/db'

export const novoRelatorioSchema = z.object({
  aluno_id: z.string().min(1, 'Selecione um aluno'),
  data: z.string().min(1, 'Selecione a data'),
  tipo: z.enum(['diario', 'pdi', 'trimestral'], { required_error: 'Selecione o tipo de documento' }),
  conteudo: z.string().min(10, 'O relatório deve conter pelo menos 10 caracteres'),
})

export type NovoRelatorioInput = z.infer<typeof novoRelatorioSchema>

export function useRelatorioForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const aluno_id_param = searchParams.get('aluno_id')
  
  const [erroGlobal, setErroGlobal] = useState<string | null>(null)
  const { alunos, loading: alunosLoading } = useAlunos()

  const form = useForm<NovoRelatorioInput>({
    resolver: zodResolver(novoRelatorioSchema),
    defaultValues: {
      aluno_id: aluno_id_param || '',
      data: new Date().toISOString().split('T')[0],
      tipo: 'diario',
      conteudo: '',
    },
  })

  // Se o aluno_id for carregado da URL depois do form inicializar (ex: suspense/router)
  useEffect(() => {
    if (aluno_id_param) {
      form.setValue('aluno_id', aluno_id_param)
    }
  }, [aluno_id_param, form])

  async function onSubmit(data: NovoRelatorioInput) {
    setErroGlobal(null)
    try {
      // Cria a entrada no indexedDB (simulação do relatorioLocalService)
      // Como não criamos um relatorioLocalService ainda, usamos o DB diretamente
      // para honrar a promessa de offline-first.
      const numAlunoId = parseInt(data.aluno_id)
      
      const payload = {
        server_id: null,
        aluno_id: numAlunoId,
        tipo: data.tipo,
        conteudo: data.conteudo,
        data_referencia: data.data,
        sync_status: 'pending' as const,
        updated_at: new Date().toISOString()
      }
      
      // Assumindo que a tabela relatorios existe no Dexie
      const localId = await db.relatorios.add(payload)
      
      // Adiciona na fila de sync
      await db.sync_queue.add({
        entidade: 'relatorio',
        operacao: 'create',
        payload: { ...payload, local_id: localId },
        prioridade: 1,
        criado_em: new Date().toISOString()
      })
      
      // Dispara o evento online localmente para forçar sync se tiver net
      window.dispatchEvent(new Event('online'))

      router.push('/relatorios')
    } catch (err) {
      console.error('[useRelatorioForm] Erro ao salvar:', err)
      setErroGlobal('Não foi possível salvar o relatório. Verifique os dados e tente novamente.')
    }
  }

  return {
    form,
    erroGlobal,
    alunos,
    alunosLoading,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    errors: form.formState.errors,
    register: form.register,
  }
}
