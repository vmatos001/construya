"use client";
import Link from 'next/link'
import { Plus, FileText, ArrowUpRight, Clock, Trash2, Activity, CheckCircle, XCircle, Send } from 'lucide-react'
import { useState, useEffect } from 'react'
import { formatUSD } from '@/lib/utils'

export default function CotizacionesPage() {
  const [bocetos, setBocetos] = useState<any[]>([])
  const [metricas, setMetricas] = useState({ enviadas: 0, aprobadas: 0, rechazadas: 0, activas: 0 })

  useEffect(() => {
    // Leer borradores nuevos (array)
    const drafts = JSON.parse(localStorage.getItem('cotizaciones_borradores') || '[]')
    
    // Migrar formato antiguo si existe
    const oldDraft = localStorage.getItem('cotizacion_borrador')
    if (oldDraft) {
      try {
        const parsed = JSON.parse(oldDraft)
        const merged = [
          ...drafts, 
          { 
            id: Date.now().toString(), 
            data: parsed.data, 
            totales: parsed.totales, 
            estado: 'borrador', 
            created_at: new Date().toISOString() 
          }
        ]
        setBocetos(merged)
        localStorage.setItem('cotizaciones_borradores', JSON.stringify(merged))
        localStorage.removeItem('cotizacion_borrador')
        updateMetrics(merged)
      } catch (e) {}
    } else {
      setBocetos(drafts)
      updateMetrics(drafts)
    }
  }, [])

  function updateMetrics(allDocs: any[]) {
    setMetricas({
      enviadas: allDocs.filter(d => d.estado === 'enviada').length,
      aprobadas: allDocs.filter(d => d.estado === 'aprobada').length,
      rechazadas: allDocs.filter(d => d.estado === 'rechazada').length,
      activas: allDocs.filter(d => d.estado === 'enviada' || d.estado === 'aprobada').length
    })
  }

  function deleteBoceto(id: string) {
    if (!confirm('¿Seguro que deseas eliminar este borrador?')) return;
    const res = bocetos.filter(b => b.id !== id)
    setBocetos(res)
    localStorage.setItem('cotizaciones_borradores', JSON.stringify(res))
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
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

      {/* PANEL DE MÉTRICAS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Borradores', value: bocetos.length, icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50 text-gray-700' },
          { label: 'Activas', value: metricas.activas, icon: Activity, color: 'text-[#121212]', bg: 'bg-[#b6f09c]/40 text-[#121212]' },
          { label: 'Enviadas', value: metricas.enviadas, icon: Send, color: 'text-blue-500', bg: 'bg-blue-50 text-blue-700' },
          { label: 'Aprobadas', value: metricas.aprobadas, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50 text-emerald-700' },
          { label: 'Rechazadas', value: metricas.rechazadas, icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 text-red-700' },
        ].map((m, i) => (
          <div key={i} className="card p-5 border border-gray-100 flex flex-col justify-center relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">{m.label}</p>
                <p className="text-3xl font-black text-gray-900 leading-none">{m.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${m.bg}`}>
                <m.icon className={`w-5 h-5 ${m.color}`} />
              </div>
            </div>
            {m.label === 'Activas' && (
               <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-[#b6f09c] rounded-full blur-[20px] opacity-30" />
            )}
          </div>
        ))}
      </div>

      {/* LISTA O EMPTY STATE */}
      {bocetos.length === 0 ? (
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
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--accent-purple)] opacity-10 blur-[60px]" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[var(--brand-500)] opacity-10 blur-[60px]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bocetos.map((boceto) => (
            <div key={boceto.id} className="card p-6 border border-gray-100 hover:shadow-xl transition-all group flex flex-col justify-between h-56 relative bg-white overflow-hidden">
              <button 
                onClick={() => deleteBoceto(boceto.id)} 
                className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                title="Eliminar borrador"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                    boceto.estado === 'borrador' ? 'bg-[#121212] text-[#b6f09c]' :
                    boceto.estado === 'enviada' ? 'bg-blue-100 text-blue-700' :
                    boceto.estado === 'aprobada' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {boceto.estado === 'borrador' ? <Clock className="w-3 h-3" /> : null}
                    {boceto.estado || 'borrador'}
                  </span>
                  <p className="text-gray-400 text-xs">{new Date(boceto.created_at).toLocaleDateString()}</p>
                </div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#121212] transition-colors line-clamp-2">
                  {boceto.data.titulo || 'Sin título'}
                </h3>
                <p className="text-sm text-gray-500 mt-1 font-medium">{boceto.data.cliente_nombre || 'Sin cliente'}</p>
              </div>

              <div className="flex items-end justify-between mt-6 relative z-10">
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-1">Total estimado</p>
                  <p className="text-xl font-black text-gray-900">{formatUSD(boceto.totales?.total || 0)}</p>
                </div>
                <Link 
                  href={`/dashboard/cotizaciones/nueva?draft=${boceto.id}`} 
                  className="w-10 h-10 rounded-[1rem] bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#b6f09c] group-hover:text-[#121212] transition-colors shadow-sm"
                  title="Continuar edición"
                >
                  <ArrowUpRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Decoración sutil de fondo al hacer hover */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-[#b6f09c] opacity-0 group-hover:opacity-10 rounded-full blur-2xl transition-all" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
