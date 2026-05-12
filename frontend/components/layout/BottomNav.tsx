'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, FileText, MoreHorizontal, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

type UserRole = 'prof_aee' | 'coordenacao' | 'prof_apoio' | 'prof_regente'

interface BottomNavProps {
  role?: UserRole
}

// Prof. AEE / Coordenação → 4 abas
const navAEE = [
  { href: '/dashboard', label: 'Home',      Icon: Home       },
  { href: '/alunos',    label: 'Alunos',    Icon: Users      },
  { href: '/relatorios',label: 'Relatórios',Icon: FileText   },
  { href: '/horarios',  label: 'Horários',  Icon: Calendar   },
]

// Apoio / Regente → 2 abas (sem FAB)
const navApoio = [
  { href: '/dashboard', label: 'Meus Alunos', Icon: Users    },
  { href: '/relatorios',label: 'Registros',   Icon: FileText },
]

export function BottomNav({ role = 'prof_aee' }: BottomNavProps) {
  const pathname = usePathname()
  const items = role === 'prof_apoio' || role === 'prof_regente' ? navApoio : navAEE

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-[--color-border] rounded-t-3xl pb-safe"
    >
      <div className="flex justify-around items-center w-full h-14 px-4 max-w-lg mx-auto">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-4 py-1 rounded-2xl transition-all min-h-[44px] min-w-[44px]',
                active
                  ? 'bg-[--color-primary-light] text-[--color-primary]'
                  : 'text-[--color-text-secondary] hover:text-[--color-primary]'
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-bold leading-none">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
