import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'

export default function CotizacionesPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cotizaciones</h1>
          <p className="text-gray-400 text-sm mt-0.5">Presupuestos y propuestas técnicas</p>
        </div>
        <Link href="/dashboard/cotizaciones/nueva" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nueva cotización
        </Link>
      </div>

      {/* Empty state */}
      <div className="card p-12 text-center">
        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-7 h-7 text-blue-600" />
        </div>
        <p className="text-gray-700 font-medium mb-1">Sin cotizaciones aún</p>
        <p className="text-gray-400 text-sm mb-4">
          Crea tu primera cotización con el banco de precios de El Salvador
        </p>
        <Link href="/dashboard/cotizaciones/nueva" className="btn-primary inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Crear cotización
        </Link>
      </div>
    </div>
  )
}
