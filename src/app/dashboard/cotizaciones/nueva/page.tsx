'use client'
import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Search, ChevronDown, Save, Send, ArrowLeft, Download, Users, HardHat } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { formatUSD, calcularTotales } from '@/lib/utils'
import type { BancoPrecio } from '@/types'

// ── Schema ───────────────────────────────────────────────────
const partidaSchema = z.object({
  descripcion:     z.string().min(1, 'Requerido'),
  unidad:          z.string().min(1, 'Requerido'),
  categoria:       z.enum(['material','mano_de_obra','equipo','subcontrato','otro']),
  cantidad:        z.coerce.number().positive('Debe ser mayor a 0'),
  precio_unitario: z.coerce.number().min(0, 'No puede ser negativo'),
  factor_desperd:  z.coerce.number().min(1).max(2).default(1),
  notas:           z.string().optional(),
})

const areaSchema = z.object({
  nombre:   z.string().min(1, 'Nombre del área requerido'),
  partidas: z.array(partidaSchema).min(1, 'Agrega al menos una partida'),
})

const cotizacionSchema = z.object({
  titulo:               z.string().min(1, 'Título requerido'),
  cliente_nombre:       z.string().min(1, 'Cliente requerido'),
  cliente_email:        z.string().email('Email inválido').optional().or(z.literal('')),
  cliente_telefono:     z.string().optional(),
  ubicacion:            z.string().optional(),
  referencia:           z.string().optional(),
  fecha_emision:        z.string(),
  fecha_validez_dias:   z.coerce.number().int().min(1).default(7),
  pct_gastos_ind:       z.coerce.number().min(0).max(100).default(10),
  pct_utilidad:         z.coerce.number().min(0).max(100).default(20),
  pct_iva:              z.coerce.number().min(0).max(100).default(13),
  pct_anticipo:         z.coerce.number().min(0).max(100).default(60),
  notas_cliente:        z.string().optional(),
  areas:                z.array(areaSchema).min(1, 'Agrega al menos un área'),
})

type FormValues = z.infer<typeof cotizacionSchema>

// ── Constantes ───────────────────────────────────────────────
const CATEGORIAS = [
  { value: 'material',     label: 'Material' },
  { value: 'mano_de_obra', label: 'Mano de obra' },
  { value: 'equipo',       label: 'Equipo' },
  { value: 'subcontrato',  label: 'Subcontrato' },
  { value: 'otro',         label: 'Otro' },
]

const UNIDADES = ['Ud','m2','m3','ml','m','kg','Saco','Galón','Rollo','Día','Global','Cubo','Viaje']

// ── Componente ───────────────────────────────────────────────
export default function NuevaCotizacionPage() {
  const router = useRouter()
  const [banco, setBanco] = useState<BancoPrecio[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [estadoActual, setEstadoActual] = useState('borrador')
  const [clientes, setClientes] = useState<any[]>([])
  const [mostrarClientes, setMostrarClientes] = useState(false)

  const hoy = new Date().toISOString().split('T')[0]

  const form = useForm<FormValues>({
    resolver: zodResolver(cotizacionSchema),
    defaultValues: {
      titulo: '',
      cliente_nombre: '',
      cliente_email: '',
      cliente_telefono: '',
      ubicacion: '',
      referencia: '',
      fecha_emision: hoy,
      fecha_validez_dias: 7,
      pct_gastos_ind: 10,
      pct_utilidad: 20,
      pct_iva: 13,
      pct_anticipo: 60,
      notas_cliente: '',
      areas: [],
    },
  })

  const { watch, register, control, handleSubmit, setValue, formState: { errors } } = form
  const { fields: areaFields, append: appendArea, remove: removeArea, replace: replaceArea } = useFieldArray({ control, name: 'areas' })

  const valores = watch()

  // Calcular totales en tiempo real
  const todasPartidas = valores.areas?.flatMap(a => a.partidas ?? []) ?? []
  const partidasConSubtotal = todasPartidas.map(p => ({
    ...p,
    subtotal: (p.cantidad ?? 0) * (p.precio_unitario ?? 0) * (p.factor_desperd ?? 1),
    categoria: p.categoria ?? 'material',
  }))
  const totales = calcularTotales({
    partidas: partidasConSubtotal,
    pctGastosInd: valores.pct_gastos_ind ?? 10,
    pctUtilidad:  valores.pct_utilidad ?? 20,
    pctIva:       valores.pct_iva ?? 13,
    pctAnticipo:  valores.pct_anticipo ?? 60,
  })

  // Cargar Referencia Automática o Borrador
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const draftId = urlParams.get('draft')

    if (draftId) {
      // Cargar del storage
      const drafts = JSON.parse(localStorage.getItem('cotizaciones_borradores') || '[]')
      const targetDraft = drafts.find((d: any) => d.id === draftId)
      if (targetDraft) {
        form.reset(targetDraft.data)
        if (targetDraft.data.areas) {
          replaceArea(targetDraft.data.areas)
        }
        if (targetDraft.estado) {
          setEstadoActual(targetDraft.estado)
        }
      }
    } else {
      // Modo nueva cotización: auto generar número correlativo
      const initData = async () => {
        const supabase = createClient()
        const { count } = await supabase.from('cotizaciones').select('*', { count: 'exact', head: true })
        const num = (count || 0) + 1
        const date = new Date()
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        form.setValue('referencia', `EMP-COT-${year}${month}-${String(num).padStart(3, '0')}`)
      }
      initData()
    }
  }, [form])

  const cargarClientes = async () => {
    const supabase = createClient()
    const { data } = await supabase.from('clientes').select('*')
    if (data) setClientes(data)
    setMostrarClientes(!mostrarClientes)
  }

  // Cargar banco de precios (Búsqueda en servidor con limite)
  useEffect(() => {
    const fetchPrecios = async () => {
      const supabase = createClient()
      let query = supabase
        .from('banco_precios')
        .select('*')
        .eq('activo', true)
        .order('descripcion', { ascending: true })
        .limit(30) // No cargar miles de productos

      if (busqueda.trim().length > 1) {
        query = query.ilike('descripcion', `%${busqueda}%`)
      }

      const { data } = await query
      if (data) setBanco(data as BancoPrecio[])
    }

    const timer = setTimeout(() => {
      fetchPrecios()
    }, 300)

    return () => clearTimeout(timer)
  }, [busqueda])

  const bancofiltrado = banco

  function agregarDesde(item: BancoPrecio, targetAreaIndex: number) {
    const areas = form.getValues('areas')
    const partidas = areas[targetAreaIndex]?.partidas ?? []
    const nuevas = [
      ...partidas,
      {
        descripcion:     item.descripcion,
        unidad:          item.unidad,
        categoria:       item.categoria,
        cantidad:        1,
        precio_unitario: item.precio_ref,
        factor_desperd:  1,
        notas:           '',
      },
    ]
    setValue(`areas.${targetAreaIndex}.partidas`, nuevas, { shouldValidate: true })
    setBusqueda('')
  }

  async function onSubmit(data: FormValues, forzarEstado?: string) {
    setGuardando(true)
    const urlParams = new URLSearchParams(window.location.search)
    const draftId = urlParams.get('draft')

    // Guardamos en un arreglo de borradores en localStorage
    const existingDrafts = JSON.parse(localStorage.getItem('cotizaciones_borradores') || '[]')
    
    // Si estamos editando un borrador existente, limpiar el viejo anterior a guardar
    const filteredDrafts = draftId ? existingDrafts.filter((d: any) => d.id !== draftId) : existingDrafts

    const finalEstado = forzarEstado || estadoActual

    const newDraft = { 
      id: draftId || Date.now().toString(), 
      data, 
      totales, 
      estado: finalEstado, 
      created_at: new Date().toISOString() 
    }
    filteredDrafts.push(newDraft)
    localStorage.setItem('cotizaciones_borradores', JSON.stringify(filteredDrafts))

    if (!forzarEstado) {
       alert(`¡Cotización procesada exitosamente como ${finalEstado}!`)
       router.push('/dashboard/cotizaciones')
    }
    
    setGuardando(false)
  }

  function handleDescargarPDF() {
    if (estadoActual === 'borrador') {
      setEstadoActual('enviada')
      onSubmit(form.getValues(), 'enviada') // Auto-save silente
    }
    setTimeout(() => {
      window.print()
    }, 500)
  }

  function onError(errores: any) {
    console.error("Errores de validación:", errores)
    alert("No se pudo guardar el borrador.\n\nPor favor, asegúrate de haber llenado:\n1. Título del Proyecto\n2. Nombre del Cliente\n3. Al menos 1 área con materiales o partidas válidas.")
  }

  return (
    <div className="p-6 max-w-6xl mx-auto print:max-w-none print:p-0">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 print:hidden">
        <Link href="/dashboard/cotizaciones" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              Cotización
              <select 
                 value={estadoActual}
                 onChange={(e) => {
                    setEstadoActual(e.target.value)
                 }}
                 className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border-none outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-offset-2 transition-colors
                   ${estadoActual === 'borrador' ? 'bg-gray-100 text-gray-600 focus:ring-gray-200' :
                     estadoActual === 'enviada' ? 'bg-blue-100 text-blue-600 focus:ring-blue-200' :
                     estadoActual === 'aprobada' ? 'bg-emerald-100 text-emerald-600 focus:ring-emerald-200' :
                     'bg-red-100 text-red-600 focus:ring-red-200'
                   }
                 `}
              >
                 <option value="borrador">⚪ Borrador</option>
                 <option value="enviada">🔵 Enviada (Activa)</option>
                 <option value="aprobada">🟢 Aprobada</option>
                 <option value="rechazada">🔴 Rechazada</option>
              </select>
            </h1>
            <p className="text-gray-400 text-xs mt-1">IVA 13% · El Salvador</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onError)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Columna izquierda: formulario ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Datos generales */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Datos del proyecto</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Título del proyecto *</label>
                  <input {...register('titulo')} className="input" placeholder="ej: Remodelación Fachada" />
                  {errors.titulo && <p className="text-red-500 text-xs mt-1">{errors.titulo.message}</p>}
                </div>
                <div>
                  <label className="label">Referencia interna</label>
                  <input {...register('referencia')} className="input" placeholder="ej: COT-2026-001" />
                </div>
                <div>
                  <label className="label">Fecha de emisión</label>
                  <input {...register('fecha_emision')} type="date" className="input" />
                </div>
                <div>
                  <label className="label">Validez (días)</label>
                  <input {...register('fecha_validez_dias')} type="number" className="input" min={1} />
                </div>
                <div>
                  <label className="label">Ubicación de la obra</label>
                  <input {...register('ubicacion')} className="input" placeholder="ej: Col. Dolores #17, Mejicanos" />
                </div>
              </div>
            </div>

            {/* Datos del cliente */}
            <div className="card p-5 relative">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700">Datos del cliente</h2>
                <button 
                  type="button" 
                  onClick={cargarClientes}
                  className="text-xs text-[#121212] bg-[#b6f09c] hover:bg-black hover:text-white px-3 py-1.5 rounded-full flex items-center gap-1 font-bold transition-colors print:hidden"
                >
                  <Users className="w-3 h-3" /> Seleccionar Existente
                </button>
              </div>
              
              {mostrarClientes && (
                <div className="absolute top-16 right-5 w-72 bg-white shadow-2xl border border-gray-100 rounded-3xl z-10 p-2 max-h-64 overflow-y-auto">
                  {clientes.length === 0 ? (
                    <p className="p-4 text-xs text-center text-gray-500 font-medium">No hay clientes guardados.</p>
                  ) : (
                    clientes.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setValue('cliente_nombre', c.nombre)
                          setValue('cliente_email', c.email || '')
                          setValue('cliente_telefono', c.telefono || '')
                          setMostrarClientes(false)
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-2xl mb-1"
                      >
                        <p className="font-bold text-gray-900">{c.nombre}</p>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{c.email || c.telefono}</p>
                      </button>
                    ))
                  )}
                  <button type="button" onClick={() => setMostrarClientes(false)} className="w-full mt-1 text-[10px] uppercase tracking-widest text-center text-gray-400 font-bold p-2 hover:bg-gray-50 rounded-xl">Cerrar buscador</button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Nombre del cliente *</label>
                  <input {...register('cliente_nombre')} className="input print:border-none print:p-0 print:bg-transparent" placeholder="ej: Manuel Arias" />
                  {errors.cliente_nombre && <p className="text-red-500 text-xs mt-1">{errors.cliente_nombre.message}</p>}
                </div>
                <div>
                  <label className="label">Email</label>
                  <input {...register('cliente_email')} type="email" className="input print:border-none print:p-0 print:bg-transparent" placeholder="cliente@email.com" />
                </div>
                <div>
                  <label className="label">Teléfono</label>
                  <input {...register('cliente_telefono')} className="input print:border-none print:p-0 print:bg-transparent" placeholder="+503 XXXX-XXXX" />
                </div>
              </div>
            </div>

            {/* Áreas y partidas */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-semibold text-gray-700">Desglose de inversión</h2>
                <button
                  type="button"
                  onClick={() => {
                    const nextNum = areaFields.length + 1
                    appendArea({ nombre: `Área ${nextNum}`, partidas: [] })
                  }}
                  className="text-xs text-[#121212] bg-[#b6f09c] hover:bg-black hover:text-white px-4 py-2 rounded-full flex items-center gap-1 font-bold transition-all shadow-sm shadow-[#b6f09c]/30 print:hidden"
                >
                  <Plus className="w-3 h-3" /> Agregar área
                </button>
              </div>

              {/* Lista vertical de áreas */}
              <div className="space-y-6">
                {areaFields.map((area, ai) => (
                  <AreaPartidas
                    key={area.id}
                    areaIndex={ai}
                    onRemove={() => removeArea(ai)}
                    form={form}
                    banco={bancofiltrado}
                    busqueda={busqueda}
                    setBusqueda={setBusqueda}
                    onAgregar={(item) => agregarDesde(item, ai)}
                  />
                ))}
                {areaFields.length === 0 && (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 bg-[#edf2ea] rounded-full flex items-center justify-center mx-auto mb-4">
                      <HardHat className="w-8 h-8 text-[#b6f09c]" />
                    </div>
                    <p className="text-gray-900 font-bold mb-1">Sin áreas definidas</p>
                    <p className="text-gray-400 text-sm max-w-xs mx-auto">Comienza agregando un área (ej. Trabajos Preliminares, Fachada, Cubierta) para cotizar.</p>
                  </div>
                )}
              </div>
            </div>


          </div>

          {/* ── Columna derecha: totales ── */}
          <div className="space-y-4">

            {/* Porcentajes (Oculto en impresión) */}
            <div className="card p-5 print:hidden">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Honorarios y gestión</h2>
              <div className="space-y-3">
                {[
                  { label: 'Gastos indirectos (%)', name: 'pct_gastos_ind' as const, hint: 'Supervisión, logística' },
                  { label: 'Utilidad (%)',           name: 'pct_utilidad'  as const, hint: 'Honorarios del contratista' },
                  { label: 'IVA (%)',                name: 'pct_iva'       as const, hint: 'Fijado en 13% para El Salvador' },
                  { label: 'Anticipo (%)',           name: 'pct_anticipo'  as const, hint: 'Pago inicial' },
                ].map(({ label, name, hint }) => (
                  <div key={name}>
                    <label className="label">{label}</label>
                    <input {...register(name)} type="number" step="0.5" min="0" max="100" className="input py-1.5" />
                    <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen financiero */}
            <div className="card p-5 sticky top-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-6">Resumen financiero</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center text-gray-500">
                  <span>Subtotal materiales</span>
                  <span className="font-medium text-gray-900">{formatUSD(totales.materiales)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-500">
                  <span>Subtotal M. Obra</span>
                  <span className="font-medium text-gray-900">{formatUSD(totales.manoObra)}</span>
                </div>

                <div className="border-t border-gray-100 pt-3 mt-3 space-y-2">
                  <div className="flex justify-between items-center font-medium">
                    <span>Costos directos</span>
                    <span>{formatUSD(totales.directos)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500">
                    <span>{`G. indirectos (${valores.pct_gastos_ind ?? 10}%)`}</span>
                    <span>{formatUSD(totales.gastosInd)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500">
                    <span>{`Utilidad (${valores.pct_utilidad ?? 20}%)`}</span>
                    <span>{formatUSD(totales.utilidad)}</span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-3 mt-3 space-y-2">
                  <div className="flex justify-between items-center font-medium">
                    <span>Subtotal s/ IVA</span>
                    <span>{formatUSD(totales.antesIva)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500">
                    <span>{`IVA ${valores.pct_iva ?? 13}%`}</span>
                    <span>{formatUSD(totales.iva)}</span>
                  </div>
                </div>
              </div>

                
                <div className="flex justify-between items-center bg-[#b6f09c]/20 p-4 rounded-2xl mt-4 mb-2">
                  <span className="text-sm font-medium text-gray-900">TOTAL</span>
                  <span className="font-black text-xl text-gray-900">{formatUSD(totales.total)}</span>
                </div>

                <div className="border-t border-gray-100 pt-3 mb-6 space-y-2 text-sm">
                  <div className="flex justify-between items-center font-medium">
                    <span>{`Anticipo (${valores.pct_anticipo ?? 60}%)`}</span>
                    <span>{formatUSD(totales.anticipo)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-500">
                    <span>{`Saldo final (${100 - (valores.pct_anticipo ?? 60)}%)`}</span>
                    <span>{formatUSD(totales.total - totales.anticipo)}</span>
                  </div>
                </div>

              <div className="space-y-3 print:hidden">
                <button 
                  type="button" 
                  onClick={handleDescargarPDF}
                  className="btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar PDF
                </button>
                <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />
                  {guardando ? 'Guardando...' : estadoActual === 'borrador' ? 'Guardar borrador' : `Guardar como ${estadoActual}`}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Clausulas a full width */}
        <div className="mt-6 card p-6">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
             <h2 className="text-sm font-semibold text-gray-700">Cláusulas y garantías (visible en PDF)</h2>
             <button
               type="button"
               onClick={() => setValue('notas_cliente', 'Los materiales serán adquiridos en centros de distribución autorizados.\nCondiciones: 60% anticipo, 40% contra entrega.\nGarantía de servicio: 6 meses sobre instalación.')}
               className="text-xs text-[#121212] bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full font-bold transition-colors print:hidden"
             >
               + Agregar cláusulas predefinidas
             </button>
           </div>
           <textarea
             {...register('notas_cliente')}
             rows={3}
             className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-1 focus:ring-[#b6f09c] transition-all resize-none text-sm text-gray-700 print:border-none print:p-0 print:bg-transparent"
             placeholder="Ej. Condiciones de pago, garantías, tiempos de entrega..."
           />
        </div>
      </form>
    </div>
  )
}

// ── Sub-componente: área con sus partidas ─────────────────────
function AreaPartidas({
  areaIndex, onRemove, form, banco, busqueda, setBusqueda, onAgregar,
}: {
  areaIndex: number
  onRemove: () => void
  form: ReturnType<typeof useForm<FormValues>>
  banco: BancoPrecio[]
  busqueda: string
  setBusqueda: (s: string) => void
  onAgregar: (item: BancoPrecio) => void
}) {
  const { register, control, watch } = form
  const { fields, append, remove } = useFieldArray({
    control,
    name: `areas.${areaIndex}.partidas`,
  })

  return (
    <div className="bg-white border border-gray-100 p-5 rounded-3xl relative shadow-sm">
      <button type="button" onClick={onRemove} className="absolute top-5 right-5 text-gray-300 hover:text-red-500 transition-colors bg-gray-50 hover:bg-red-50 p-2 rounded-full print:hidden">
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Nombre del área */}
      <div className="mb-4 pr-12">
        <input
          {...register(`areas.${areaIndex}.nombre`)}
          className="text-lg font-bold bg-transparent border-none p-0 focus:ring-0 text-gray-900 placeholder:text-gray-300 w-full"
          placeholder="Nombre del área..."
        />
      </div>

      {/* Tabla de partidas (ARRIBA) */}
      {fields.length > 0 && (
        <div className="overflow-x-auto mb-2 border-t border-gray-50 pt-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400">
                <th className="text-left pb-2 font-bold uppercase tracking-wider w-1/3">Descripción</th>
                <th className="text-left pb-2 font-bold uppercase tracking-wider w-16">Ud</th>
                <th className="text-right pb-2 font-bold uppercase tracking-wider w-16">Cant.</th>
                <th className="text-right pb-2 font-bold uppercase tracking-wider w-20">P.U.</th>
                <th className="text-right pb-2 font-bold uppercase tracking-wider w-20">Subtotal</th>
                <th className="w-8 print:hidden"></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, pi) => {
                const cant = watch(`areas.${areaIndex}.partidas.${pi}.cantidad`) || 0
                const pu   = watch(`areas.${areaIndex}.partidas.${pi}.precio_unitario`) || 0
                const fd   = watch(`areas.${areaIndex}.partidas.${pi}.factor_desperd`) || 1
                const sub  = cant * pu * fd
                return (
                  <tr key={field.id} className="border-b border-gray-50 group hover:bg-gray-50 transition-colors">
                    <td className="py-2 pr-2">
                      <input
                        {...register(`areas.${areaIndex}.partidas.${pi}.descripcion`)}
                        className="w-full bg-transparent focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#b6f09c] rounded px-2 py-1.5 font-medium text-gray-900 print:border-none print:p-0"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <select
                        {...register(`areas.${areaIndex}.partidas.${pi}.unidad`)}
                        className="w-full bg-transparent focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#b6f09c] rounded px-1 py-1.5 print:appearance-none"
                      >
                        {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        {...register(`areas.${areaIndex}.partidas.${pi}.cantidad`)}
                        type="number" step="0.01" min="0"
                        className="w-full bg-transparent text-right focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#b6f09c] rounded px-2 py-1.5 font-bold text-gray-900 print:border-none print:p-0"
                      />
                    </td>
                    <td className="py-2 pr-2">
                      <input
                        {...register(`areas.${areaIndex}.partidas.${pi}.precio_unitario`)}
                        type="number" step="0.01" min="0"
                        className="w-full bg-transparent text-right focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#b6f09c] rounded px-2 py-1.5 print:border-none print:p-0"
                      />
                    </td>
                    <td className="py-2 pr-2 text-right font-bold text-gray-900">
                      {formatUSD(sub)}
                    </td>
                    <td className="py-2 text-right print:hidden">
                      <button
                        type="button"
                        onClick={() => remove(pi)}
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:text-red-500 text-gray-300 transition-all rounded-md hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Botón agregar partida manual */}
      <div className="flex justify-start mb-6 mt-1 print:hidden">
        <button
          type="button"
          onClick={() => append({
            descripcion: '', unidad: 'Ud', categoria: 'material',
            cantidad: 1, precio_unitario: 0, factor_desperd: 1, notas: '',
          })}
          className="text-xs text-gray-500 hover:text-[#121212] flex items-center gap-1 font-bold transition-colors py-1.5 px-3 hover:bg-gray-100 rounded-lg bg-transparent"
        >
          <Plus className="w-3 h-3" /> Añadir manual
        </button>
      </div>

      {/* Buscador de Banco de Precios OSCURO */}
      <div className="bg-[#121212] rounded-2xl p-4 mx-4 mt-2 print:hidden relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--accent-purple)] opacity-10 blur-[40px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex gap-2">
          <input
            className="input text-white border-white/10 bg-white/5 focus:bg-white/10 focus:ring-white/20 placeholder:text-gray-500 rounded-xl"
            placeholder="Buscar precio guardado..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        
        {busqueda.length > 1 && (
          <div className="mt-4 max-h-60 overflow-y-auto space-y-1 relative z-10 custom-scrollbar pr-2">
            {banco.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => onAgregar(item)}
              >
                <div>
                  <span className="text-sm font-bold text-gray-900 group-hover:text-black">{item.descripcion}</span>
                  <span className="text-xs font-mono font-bold text-gray-400 ml-2 group-hover:text-gray-700">{item.unidad}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900">{formatUSD(item.precio_ref)}</span>
                  <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-[#121212] transition-colors shadow-sm">
                    <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#b6f09c]" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Helper ────────────────────────────────────────────────────
function Row({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? 'text-gray-500' : 'text-gray-700 font-medium'}`}>
      <span>{label}</span>
      <span>{formatUSD(value)}</span>
    </div>
  )
}
