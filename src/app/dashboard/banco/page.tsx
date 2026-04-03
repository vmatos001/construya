'use client'
import { useState, useEffect } from 'react'
import { 
  Plus, Search, Filter, RefreshCw, ExternalLink, 
  TrendingUp, TrendingDown, BookOpen, HardHat, Info
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { cn, formatUSD } from '@/lib/utils'
import type { BancoPrecio } from '@/types'

export default function BancoPreciosPage() {
  const [items, setItems] = useState<BancoPrecio[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [search, setSearch] = useState('')
  const [categoria, setCategoria] = useState('')
  
  const supabase = createClient()

  const fetchPrecios = async () => {
    setLoading(true)
    let query = supabase
      .from('banco_precios')
      .select('*, precios_fuentes:banco_precios_fuentes(*, fuente:ferreteria_fuentes(*))')
      .order('descripcion', { ascending: true })

    if (search) query = query.ilike('descripcion', `%${search}%`)
    if (categoria) query = query.eq('categoria', categoria)

    const { data, error } = await query
    if (!error && data) {
      setItems(data as BancoPrecio[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchPrecios()
  }, [search, categoria])

  const handleSyncEPA = async () => {
    setSyncing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const resp = await fetch('https://idpqeviidafxyhyxlpfb.supabase.co/functions/v1/scraper-epa', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token ?? ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: false })
      })
      const result = await resp.json()
      if (result.ok) {
        alert(`Sincronización exitosa: ${result.inserted} productos actualizados.`)
        fetchPrecios()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Banco de Precios</h1>
          <p className="text-gray-400 font-medium mt-1">Catálogo maestro de materiales y mano de obra para El Salvador</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSyncEPA}
            disabled={syncing}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
            {syncing ? 'Sincronizando...' : 'Sincronizar EPA'}
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nuevo Artículo
          </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="card-dark p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#b6f09c] rounded-2xl flex items-center justify-center">
               <BookOpen className="w-6 h-6 text-[#121212]" />
            </div>
            <div>
               <p className="text-[10px] font-bold text-[#b6f09c] uppercase tracking-widest">Catálogo</p>
               <p className="text-2xl font-bold">{items.length} Artículos</p>
            </div>
         </div>
         <div className="card p-6 border-none shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-[#f0f3ed] rounded-2xl flex items-center justify-center">
               <TrendingUp className="w-6 h-6 text-[#121212]" />
            </div>
            <div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tendencia</p>
               <p className="text-2xl font-bold text-gray-900">+4.2% mes</p>
            </div>
         </div>
         <div className="card p-6 border-none shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-[#c5beff] rounded-2xl flex items-center justify-center">
               <HardHat className="w-6 h-6 text-[#121212]" />
            </div>
            <div>
               <p className="text-[10px] font-bold text-[#c5beff] uppercase tracking-widest">Última Actualización</p>
               <p className="text-xl font-bold text-gray-900">Hoy, 10:45 AM</p>
            </div>
         </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar materiales, herramientas o servicios..." 
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#b6f09c] transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="w-full sm:w-48 px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          <option value="material">Materiales</option>
          <option value="mano_de_obra">Mano de Obra</option>
          <option value="equipo">Equipo</option>
        </select>
        <button className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-900 transition-colors">
          <Filter className="w-5 h-5" />
        </button>
      </div>

      {/* Table Section */}
      <div className="card border-none shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Descripción</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Unidad</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Categoría</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Precio Ref.</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fuente</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-6"><div className="h-4 bg-gray-100 rounded w-48" /></td>
                    <td className="px-6 py-6"><div className="h-4 bg-gray-100 rounded w-12 mx-auto" /></td>
                    <td className="px-6 py-6"><div className="h-6 bg-gray-100 rounded-full w-24" /></td>
                    <td className="px-6 py-6"><div className="h-4 bg-gray-100 rounded w-20 ml-auto" /></td>
                    <td className="px-6 py-6"><div className="h-4 bg-gray-100 rounded w-16" /></td>
                    <td className="px-6 py-6" />
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">
                    No se encontraron artículos que coincidan con tu búsqueda.
                  </td>
                </tr>
              ) : items.map((item) => (
                <tr key={item.id} className="group hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900 group-hover:text-[#121212] transition-colors">{item.descripcion}</p>
                    <p className="text-[10px] font-mono text-gray-400 mt-0.5">{item.codigo || 'SIN-CODIGO'}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{item.unidad}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "badge",
                      item.categoria === 'material' ? 'badge-mint' : 'badge-purple'
                    )}>
                      {item.categoria.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-bold text-gray-900">{formatUSD(item.precio_ref)}</p>
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-[10px] text-green-600 font-bold">2.5%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {item.precios_fuentes && item.precios_fuentes.length > 0 ? (
                        item.precios_fuentes.map((pf) => (
                          <div key={pf.id} className="flex items-center gap-2">
                             <div className="w-5 h-5 bg-[#121212] rounded-md flex items-center justify-center">
                                <span className="text-[8px] font-bold text-white uppercase">{pf.fuente?.nombre.substring(0, 3)}</span>
                             </div>
                             <span className="text-[10px] font-bold text-gray-500">{formatUSD(pf.precio)}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[10px] text-gray-300 font-bold italic">Manual</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExternalLink className="w-4 h-4 text-gray-400 hover:text-gray-900" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-[#121212] rounded-[2.5rem] p-6 text-white flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
        <div className="w-16 h-16 bg-[#b6f09c] rounded-2xl flex items-center justify-center flex-shrink-0 animate-bounce">
          <Info className="w-8 h-8 text-[#121212]" />
        </div>
        <div>
          <h4 className="font-bold text-lg mb-1 italic">¿Sabías que los precios se promedian automáticamente?</h4>
          <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
            ContruYA escanea ferreterías diariamente. El "Precio Ref." mostrado es un promedio inteligente entre proveedores para asegurar tus cotizaciones contra la inflación.
          </p>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-[var(--accent-purple)] opacity-10 blur-[60px]" />
      </div>
    </div>
  )
}
