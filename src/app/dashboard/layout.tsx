'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FileText, HardHat, Users, BookOpen, Settings, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard',             label: 'Inicio',        icon: LayoutDashboard },
  { href: '/dashboard/cotizaciones',label: 'Cotizaciones',  icon: FileText },
  { href: '/dashboard/obras',       label: 'Obras',         icon: HardHat },
  { href: '/dashboard/clientes',    label: 'Clientes',      icon: Users },
  { href: '/dashboard/banco',       label: 'Banco de Precios', icon: BookOpen },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── Sidebar ── */}
      <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-700 rounded-lg flex items-center justify-center">
              <HardHat className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">ContruYA</p>
              <p className="text-xs text-gray-400">El Salvador</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = path === href || path.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group',
                  active
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-brand-700' : 'text-gray-400 group-hover:text-gray-600')} />
                {label}
                {active && <ChevronRight className="w-3 h-3 ml-auto text-brand-500" />}
              </Link>
            )
          })}
        </nav>

        {/* Settings */}
        <div className="px-3 py-4 border-t border-gray-100">
          <Link
            href="/dashboard/configuracion"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Configuración
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
