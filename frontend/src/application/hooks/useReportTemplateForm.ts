'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/infrastructure/http/client'

export interface CampoTemplate {
  id: string
  label: string
  tipo: 'text' | 'textarea' | 'date' | 'number'
}

export function useReportTemplateForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [erroGlobal, setErroGlobal] = useState<string | null>(null)
  
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [papeisComAcesso, setPapeisComAcesso] = useState<string[]>([])
  const [campos, setCampos] = useState<CampoTemplate[]>([
    { id: crypto.randomUUID(), label: 'Nome do Aluno', tipo: 'text' }
  ])

  const addCampo = () => {
    setCampos([...campos, { id: crypto.randomUUID(), label: '', tipo: 'text' }])
  }

  const removeCampo = (id: string) => {
    setCampos(campos.filter(c => c.id !== id))
  }

  const updateCampo = (id: string, updates: Partial<CampoTemplate>) => {
    setCampos(campos.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroGlobal(null)
    setIsSubmitting(true)

    try {
      const payload = {
        nome,
        descricao,
        papeis_com_acesso: papeisComAcesso,
        secoes: { campos }
      }
      await apiClient.post('/api/relatorios/templates', payload)
      router.push('/relatorios')
      router.refresh()
    } catch (error: any) {
      setErroGlobal(error.detail || 'Ocorreu um erro ao salvar o template.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    nome, setNome,
    descricao, setDescricao,
    papeisComAcesso, setPapeisComAcesso,
    campos, addCampo, removeCampo, updateCampo,
    isSubmitting,
    erroGlobal,
    onSubmit
  }
}
