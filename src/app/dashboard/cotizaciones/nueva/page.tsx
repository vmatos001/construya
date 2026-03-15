'use client'
import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Search, ChevronDown, Save, Send, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
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
  const [banco, setBanco] = useState<BancoPrecio[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [areaActiva, setAreaActiva] = useState(0)
  const [guardando, setGuardando] = useState(false)

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
      notas_cliente:
        'Los materiales serán adquiridos en centros de distribución autorizados (EPA, Vidrí, Freund). ' +
        'Condiciones: 60% anticipo, 40% contra entrega. Garantía de servicio: 6 meses sobre instalación.',
      areas: [{ nombre: 'Área 1', partidas: [] }],
    },
  })

  const { watch, register, control, handleSubmit, setValue, formState: { errors } } = form
  const { fields: areaFields, append: appendArea, remove: removeArea } = useFieldArray({ control, name: 'areas' })

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

  // Cargar banco de precios
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('banco_precios')
      .select('*')
      .eq('activo', true)
      .order('categoria')
      .order('descripcion')
      .then(({ data }) => { if (data) setBanco(data as BancoPrecio[]) })
  }, [])

  const bancofiltrado = busqueda.length > 1
    ? banco.filter(b =>
        b.descripcion.toLowerCase().includes(busqueda.toLowerCase()) ||
        (b.subcategoria ?? '').toLowerCase().includes(busqueda.toLowerCase())
      )
    : banco.slice(0, 20)

  function agregarDesde(item: BancoPrecio) {
    const areas = form.getValues('areas')
    const partidas = areas[areaActiva]?.partidas ?? []
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
    setValue(`areas.${areaActiva}.partidas`, nuevas, { shouldValidate: true })
    setBusqueda('')
  }

  async function onSubmit(data: FormValues) {
    setGuardando(true)
    // En MVP guardamos en localStorage como borrador mientras no hay auth
    localStorage.setItem('cotizacion_borrador', JSON.stringify({ data, totales }))
    alert('Cotización guardada como borrador. Próximamente: guardar en la base de datos.')
    setGuardando(false)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/cotizaciones" className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nueva Cotización</h1>
          <p className="text-gray-400 text-xs">IVA 13% · El Salvador</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
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
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Cliente</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Nombre del cliente *</label>
                  <input {...register('cliente_nombre')} className="input" placeholder="ej: Manuel Arias" />
                  {errors.cliente_nombre && <p className="text-red-500 text-xs mt-1">{errors.cliente_nombre.message}</p>}
                </div>
                <div>
                  <label className="label">Email</label>
                  <input {...register('cliente_email')} type="email" className="input" placeholder="cliente@email.com" />
                </div>
                <div>
                  <label className="label">Teléfono</label>
                  <input {...register('cliente_telefono')} className="input" placeholder="+503 XXXX-XXXX" />
                </div>
              </div>
            </div>

            {/* Áreas y partidas */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700">Desglose de inversión</h2>
                <button
                  type="button"
                  onClick={() => appendArea({ nombre: `Área ${areaFields.length + 1}`, partidas: [] })}
                  className="text-xs text-brand-700 hover:text-brand-900 flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3 h-3" /> Agregar área
                </button>
              </div>

              {/* Tabs de áreas */}
              <div className="flex gap-1 mb-4 border-b border-gray-100 pb-1 overflow-x-auto">
                {areaFields.map((area, ai) => (
                  <button
                    key={area.id}
                    type="button"
                    onClick={() => setAreaActiva(ai)}
                    className={`px-3 py-1.5 rounded-t text-xs font-medium whitespace-nowrap transition-colors ${
                      areaActiva === ai
                        ? 'bg-brand-700 text-white'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {watch(`areas.${ai}.nombre`) || `Área ${ai + 1}`}
                    {areaFields.length > 1 && (
                      <span
                        onClick={e => { e.stopPropagation(); removeArea(ai); setAreaActiva(0) }}
                        className="ml-1.5 opacity-60 hover:opacity-100 cursor-pointer"
                      >×</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Área activa */}
              {areaFields.map((area, ai) => (
                <AreaPartidas
                  key={area.id}
                  areaIndex={ai}
                  visible={ai === areaActiva}
                  form={form}
                  banco={bancofiltrado}
                  busqueda={busqueda}
                  setBusqueda={setBusqueda}
                  onAgregar={agregarDesde}
                />
              ))}
            </div>

            {/* Notas y cláusulas */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Cláusulas y garantías (visible en PDF)</h2>
              <textarea
                {...register('notas_cliente')}
                rows={4}
                className="input resize-none"
                placeholder="Condiciones de pago, garantías, vigencia de precios..."
              />
            </div>
          </div>

          {/* ── Columna derecha: totales ── */}
          <div className="space-y-4">

            {/* Porcentajes */}
            <div className="card p-5">
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
                    <input {...register(name)} type="number" step="0.5" min="0" max="100" className="input" />
                    <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen de totales */}
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Resumen de inversión</h2>
              <div className="space-y-2 text-sm">
                <Row label="Materiales"        value={totales.materiales} muted />
                <Row label="Mano de obra"      value={totales.manoObra}   muted />
                {totales.otros > 0 && <Row label="Otros" value={totales.otros} muted />}
                <div className="border-t border-gray-100 pt-2">
                  <Row label="Costos directos"     value={totales.directos} />
                  <Row label={`G. indirectos (${valores.pct_gastos_ind ?? 10}%)`} value={totales.gastosInd} muted />
                  <Row label={`Utilidad (${valores.pct_utilidad ?? 20}%)`}        value={totales.utilidad}  muted />
                </div>
                <div className="border-t border-gray-100 pt-2">
                  <Row label="Subtotal s/ IVA"      value={totales.antesIva} />
                  <Row label={`IVA ${valores.pct_iva ?? 13}%`} value={totales.iva} muted />
                </div>
                <div className="border-t-2 border-brand-700 pt-2">
                  <div className="flex justify-between items-baseline font-bold">
                    <span className="text-gray-900">TOTAL</span>
                    <span className="text-brand-700 text-lg">{formatUSD(totales.total)}</span>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-2 space-y-1">
                  <Row label={`Anticipo (${valores.pct_anticipo ?? 60}%)`}  value={totales.anticipo} />
                  <Row label={`Saldo final (${100 - (valores.pct_anticipo ?? 60)}%)`} value={totales.total - totales.anticipo} />
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="space-y-2">
              <button
                type="submit"
                disabled={guardando}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {guardando ? 'Guardando...' : 'Guardar borrador'}
              </button>
              <button type="button" className="btn-secondary w-full flex items-center justify-center gap-2" disabled>
                <Send className="w-4 h-4" />
                Enviar al cliente
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

// ── Sub-componente: área con sus partidas ─────────────────────
function AreaPartidas({
  areaIndex, visible, form, banco, busqueda, setBusqueda, onAgregar,
}: {
  areaIndex: number
  visible: boolean
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

  if (!visible) return null

  return (
    <div>
      {/* Nombre del área */}
      <div className="mb-4">
        <label className="label">Nombre del área</label>
        <input
          {...register(`areas.${areaIndex}.nombre`)}
          className="input"
          placeholder="ej: Área 1 - Fachada"
        />
      </div>

      {/* Buscador del banco de precios */}
      <div className="mb-4">
        <label className="label">Buscar en banco de precios de El Salvador</label>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="input pl-9"
            placeholder="Buscar materiales, mano de obra..."
          />
        </div>
        {(busqueda.length > 1 || busqueda === '') && banco.length > 0 && (
          <div className="mt-1 border border-gray-100 rounded-lg overflow-hidden shadow-sm max-h-48 overflow-y-auto">
            {banco.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => onAgregar(item)}
                className="w-full px-3 py-2 text-left hover:bg-brand-50 transition-colors flex items-center justify-between group"
              >
                <div>
                  <span className="text-sm text-gray-700">{item.descripcion}</span>
                  <span className="text-xs text-gray-400 ml-2">{item.unidad}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{formatUSD(item.precio_ref)}</span>
                  <Plus className="w-3 h-3 text-brand-700 opacity-0 group-hover:opacity-100" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabla de partidas */}
      {fields.length > 0 && (
        <div className="overflow-x-auto mb-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-2 font-medium text-gray-500 w-1/3">Descripción</th>
                <th className="text-left py-2 px-2 font-medium text-gray-500 w-16">Ud</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 w-16">Cant.</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 w-20">P.U.</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 w-20">Subtotal</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, pi) => {
                const cant = watch(`areas.${areaIndex}.partidas.${pi}.cantidad`) || 0
                const pu   = watch(`areas.${areaIndex}.partidas.${pi}.precio_unitario`) || 0
                const fd   = watch(`areas.${areaIndex}.partidas.${pi}.factor_desperd`) || 1
                const sub  = cant * pu * fd
                return (
                  <tr key={field.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-1.5 px-2">
                      <input
                        {...register(`areas.${areaIndex}.partidas.${pi}.descripcion`)}
                        className="w-full bg-transparent focus:outline-none focus:bg-white focus:border focus:border-brand-300 rounded px-1 py-0.5"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <select
                        {...register(`areas.${areaIndex}.partidas.${pi}.unidad`)}
                        className="w-full bg-transparent focus:outline-none text-xs"
                      >
                        {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        {...register(`areas.${areaIndex}.partidas.${pi}.cantidad`)}
                        type="number" step="0.01" min="0"
                        className="w-full bg-transparent text-right focus:outline-none focus:bg-white focus:border focus:border-brand-300 rounded px-1 py-0.5"
                      />
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        {...register(`areas.${areaIndex}.partidas.${pi}.precio_unitario`)}
                        type="number" step="0.01" min="0"
                        className="w-full bg-transparent text-right focus:outline-none focus:bg-white focus:border focus:border-brand-300 rounded px-1 py-0.5"
                      />
                    </td>
                    <td className="py-1.5 px-2 text-right font-medium text-gray-700">
                      {formatUSD(sub)}
                    </td>
                    <td className="py-1.5 px-1">
                      <button
                        type="button"
                        onClick={() => remove(pi)}
                        className="p-1 hover:text-red-500 text-gray-300 transition-colors"
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
      <button
        type="button"
        onClick={() => append({
          descripcion: '', unidad: 'Ud', categoria: 'material',
          cantidad: 1, precio_unitario: 0, factor_desperd: 1, notas: '',
        })}
        className="text-xs text-brand-700 hover:text-brand-900 flex items-center gap-1 font-medium"
      >
        <Plus className="w-3 h-3" /> Agregar partida manualmente
      </button>
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
