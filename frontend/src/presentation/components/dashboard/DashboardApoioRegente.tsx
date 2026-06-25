'use client'

import Link from 'next/link'
import { ArrowRight, Camera, FileText, Users } from 'lucide-react'
import { useAlunos } from '@/application/hooks/useAlunos'
import { usePapel } from '@/application/hooks/usePapel'

export function DashboardApoioRegente() {
  const { alunos } = useAlunos()
  const dadosUsuario = usePapel()
  const meuAluno = alunos?.find((a) => a.status === 'ativo')

  return (
    <div className="max-w-[1160px] mx-auto px-6 py-9 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Olá, {dadosUsuario?.nome || 'Usuário'}!</h2>
          <p className="text-sm text-gray-500 mt-1">Acompanhe seus alunos</p>
        </div>
        <Link
          href="/momentos/registrar"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <Camera size={15} />
          Registrar Momento
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/alunos"
            className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 block hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-blue-50">
              <Users size={18} color="#2563eb" />
            </div>
            
                <p className="text-lg font-extrabold text-gray-900 leading-none">{alunos?.length ?? 0} Alunos</p>
                <p className="text-sm font-medium text-gray-500 mt-1">Meus Alunos</p>
          
          </Link>

        <Link
          href="/relatorios"
          className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 block hover:shadow-md hover:border-purple-300 hover:-translate-y-0.5 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-purple-50">
            <FileText size={18} color="#7c3aed" />
          </div>
          <h3 className="text-lg font-extrabold text-gray-900 leading-tight">Relatórios</h3>
          <p className="text-sm font-medium text-gray-500 mt-1">Crie e gerencie</p>
        </Link>
      </div>

      {/* Atalho Registrar Momento */}
      <div>
        <p className="text-sm font-bold text-gray-900 mb-3">Ações Rápidas</p>
        <Link
          href="/momentos/registrar"
          className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 flex items-center gap-4 hover:shadow-md hover:border-gray-300 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center bg-slate-50">
            <Camera size={17} color="#4b5563" />
          </div>
          <span className="flex-1 text-sm font-semibold text-gray-900">Registrar Momento Pedagógico</span>
          <ArrowRight size={14} className="text-gray-300 shrink-0" />
        </Link>
      </div>
    </div>
  )
}
