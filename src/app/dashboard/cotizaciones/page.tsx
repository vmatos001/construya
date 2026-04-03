import Link from 'next/link'
import { Plus, FileText, ArrowUpRight } from 'lucide-react'

export default function CotizacionesPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Cotizaciones</h1>
          <p className="text-gray-400 font-medium mt-1">Presupuestos y propuestas técnicas — El Salvador</p>
        </div>
        <Link href="/dashboard/cotizaciones/nueva" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nueva cotización
        </Link>
      </div>

      {/* Empty state: Redesigned based on reference style */}
      <div className="card p-16 text-center border-none shadow-sm relative overflow-hidden group">
        <div className="w-20 h-20 bg-[var(--brand-500)] rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[var(--brand-500)]/20 transition-transform group-hover:scale-110">
          <FileText className="w-10 h-10 text-[var(--card-dark)]" />
        </div>
        
        <div className="max-w-sm mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sin cotizaciones oficiales aún</h2>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            Consigue el banco de precios de El Salvador actualizado y empieza a generar presupuestos profesionales en minutos.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/dashboard/cotizaciones/nueva" className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
            <Plus className="w-5 h-5" />
            Crear Cotización
          </Link>
          <button className="btn-secondary flex items-center gap-2 w-full sm:w-auto justify-center">
            Importar Excel
            <ArrowUpRight className="w-4 h-4 opacity-40" />
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--accent-purple)] opacity-10 blur-[60px]" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[var(--brand-500)] opacity-10 blur-[60px]" />
      </div>
    </div>
  )
}
