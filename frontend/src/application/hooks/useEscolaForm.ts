'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiClient } from '@/infrastructure/http/client'

export const novaEscolaSchema = z.object({
  nome: z.string().min(3, 'Nome deve conter pelo menos 3 caracteres'),
})

export type NovaEscolaInput = z.infer<typeof novaEscolaSchema>

export function useEscolaForm() {
  const router = useRouter()
  const [erroGlobal, setErroGlobal] = useState<string | null>(null)

  const form = useForm<NovaEscolaInput>({
    resolver: zodResolver(novaEscolaSchema),
    defaultValues: {
      nome: '',
    },
  })

  async function onSubmit(data: NovaEscolaInput) {
    setErroGlobal(null)
    try {
      await apiClient.post('/api/escolas', { nome: data.nome })
      router.push('/escolas')
    } catch (err: any) {
      console.error('[useEscolaForm] Erro:', err)
      setErroGlobal(err.response?.data?.detail || 'Não foi possível salvar a escola. Tente novamente.')
    }
  }

  return {
    form,
    erroGlobal,
    onSubmit: form.handleSubmit(onSubmit),
    isSubmitting: form.formState.isSubmitting,
    errors: form.formState.errors,
    register: form.register,
  }
}
