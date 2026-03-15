import { FileText, HardHat, Users, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const stats = [
  { label: 'Cotizaciones activas', value: '0', icon: FileText,  color: 'text-blue-600',   bg: 'bg-blue-50' },
  { label: 'Obras en progreso',    value: '0', icon: HardHat,   color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'Clientes',             value: '0', icon: Users,     color: 'text-green-600',  bg: 'bg-green-50' },
  { label: 'Ingresos del mes',     value: '$0', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
]

const acciones = [
  { href: '/dashboard/cotizaciones/nueva', label: 'Nueva cotización', icon: FileText, desc: 'Crear presupuesto para un cliente' },
  { href: '/dashboard/clientes/nuevo',     label: 'Nuevo cliente',     icon: Users,   desc: 'Agregar contacto al CRM' },
  { href: '/dashboard/obras/nueva',        label: 'Nueva obra',        icon: HardHat, desc: 'Iniciar seguimiento de proyecto' },
]

export default function DashboardPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bienvenido a ContruYA</h1>
        <p className="text-gray-500 text-sm mt-1">Gestión de construcción para El Salvador — IVA 13%</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Acciones rápidas */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Acciones rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {acciones.map(({ href, label, icon: Icon, desc }) => (
            <Link
              key={href}
              href={href}
              className="card p-4 flex items-center gap-4 hover:border-brand-500 hover:shadow-md transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-brand-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                  {label}
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
                <p className="text-xs text-gray-400 truncate">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Estado vacío */}
      <div className="card p-8 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <HardHat className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-gray-700 font-medium mb-1">Tu proyecto está listo</p>
        <p className="text-gray-400 text-sm mb-4">
          Comienza creando tu primera cotización para un cliente en El Salvador
        </p>
        <Link href="/dashboard/cotizaciones/nueva" className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Crear primera cotización
        </Link>
      </div>
    </div>
  )
}
