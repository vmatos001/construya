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
    <div className="flex h-screen overflow-hidden bg-[var(--background)] print:h-auto print:overflow-visible print:block print:bg-white">
      {/* ── Sidebar ── */}
      <aside className="sidebar w-64 flex-shrink-0 flex flex-col print:hidden">
        {/* Logo */}
        <div className="px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#121212] rounded-2xl flex items-center justify-center shadow-lg">
              <HardHat className="w-5 h-5 text-[#b6f09c]" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 tracking-tighter">ContruYA</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">El Salvador</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = path === href || (href !== '/dashboard' && path.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all duration-300 group',
                  active
                    ? 'bg-[#b6f09c] text-[#121212] font-bold shadow-sm'
                    : 'text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm'
                )}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0 transition-colors', active ? 'text-[#121212]' : 'text-gray-400 group-hover:text-gray-600')} />
                {label}
                {active && <ChevronRight className="w-4 h-4 ml-auto opacity-40" />}
              </Link>
            )
          })}
        </nav>

        {/* Settings */}
        <div className="px-4 py-8">
          <Link
            href="/dashboard/configuracion"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all",
              path === '/dashboard/configuracion' 
                ? "bg-[#b6f09c] text-[#121212] font-bold" 
                : "text-gray-400 hover:bg-white hover:text-gray-600"
            )}
          >
            <Settings className="w-5 h-5" />
            Configuración
          </Link>
          
          <div className="mt-6 px-2">
             <div className="bg-[#121212] rounded-3xl p-4 flex items-center gap-3 shadow-xl">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#b6f09c] to-[#c5beff]" />
                <div className="flex-1 min-w-0">
                   <p className="text-xs font-bold text-white truncate">Victor Matos</p>
                   <p className="text-[9px] text-gray-400 font-bold uppercase truncate">Pro Plan</p>
                </div>
             </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto pt-4 pr-4 pb-4 print:p-0 print:overflow-visible">
        <div className="h-full bg-white/20 backdrop-blur-sm rounded-[3rem] border border-white/40 shadow-inner overflow-y-auto print:h-auto print:bg-white print:border-none print:shadow-none print:rounded-none print:overflow-visible">
          {children}
        </div>
      </main>
    </div>
  )
}
