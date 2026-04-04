'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, ArrowLeft, Building2, User } from 'lucide-react'
import { createClient } from '@/lib/supabase'

// ── ESQUEMA ZOD (Reglas de negocio El Salvador) ──
const clienteSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  tipo: z.enum(['persona_natural', 'empresa']),
  estado: z.enum(['prospecto', 'activo', 'inactivo']),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  dui: z.string().optional(),
  nit: z.string().optional(),
  direccion: z.string().optional(),
  departamento: z.string().optional(),
  municipio: z.string().optional(),
  notas: z.string().optional(),
})

type FormValues = z.infer<typeof clienteSchema>

export default function NuevoClientePage() {
  const router = useRouter()
  const [guardando, setGuardando] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      tipo: 'persona_natural',
      estado: 'prospecto',
      nombre: '',
      email: '',
      telefono: '',
      dui: '',
      nit: '',
      direccion: '',
      departamento: '',
      municipio: '',
      notas: ''
    }
  })

  const tipo = watch('tipo')

  const onSubmit = async (data: FormValues) => {
    setGuardando(true)
    const supabase = createClient()
    
    // Asumimos un empresa_id base mientras conectas el auth (igual que en los seeds)
    const dbPayload = {
      ...data,
      empresa_id: '123e4567-e89b-12d3-a456-426614174000',
    }

    const { error } = await supabase.from('clientes').insert([dbPayload])

    if (error) {
      console.error('Error insertando cliente:', error)
      alert('Error en la base de datos al guardar cliente.')
      setGuardando(false)
      return
    }

    // Volver a la lista
    router.push('/dashboard/clientes')
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      
      {/* ── ENCABEZADO ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clientes" className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Registrar Cliente</h1>
            <p className="text-sm text-gray-500">Expande tu red comercial y cartera de prospectos.</p>
          </div>
        </div>
        <button 
          onClick={handleSubmit(onSubmit)} 
          disabled={guardando}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {guardando ? 'Guardando en Bóveda...' : 'Guardar Cliente'}
        </button>
      </div>

      <form className="space-y-6">
        
        {/* PARTE SUPERIOR (TIPO Y ESTADO) */}
        <div className="card p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label">Tipo de Entidad</label>
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <label className={`flex-1 flex gap-2 items-center justify-center py-2.5 text-sm font-bold rounded-lg cursor-pointer transition-all ${tipo === 'persona_natural' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>
                <input type="radio" value="persona_natural" {...register('tipo')} className="sr-only" />
                <User className="w-4 h-4" /> Natural
              </label>
              <label className={`flex-1 flex gap-2 items-center justify-center py-2.5 text-sm font-bold rounded-lg cursor-pointer transition-all ${tipo === 'empresa' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>
                <input type="radio" value="empresa" {...register('tipo')} className="sr-only" />
                <Building2 className="w-4 h-4" /> Empresa
              </label>
            </div>
          </div>
          <div>
             <label className="label">Etapa Comercial (Estado)</label>
             <select {...register('estado')} className="input py-3">
               <option value="prospecto">Potencial (Prospecto)</option>
               <option value="activo">Activo (Cartera Fija)</option>
               <option value="inactivo">Inactivo / Pasivo</option>
             </select>
          </div>
        </div>

        {/* DATOS PRINCIPALES */}
        <div className="card p-6">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-5">Identidad</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="label">Nombre o Razón Social <span className="text-red-500">*</span></label>
              <input {...register('nombre')} className="input" placeholder="Ej. Constructora del Valle S.A. de C.V." />
              {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
            </div>

            <div>
              <label className="label">DUI (Opcional)</label>
              <input {...register('dui')} className="input" placeholder="00000000-0" />
            </div>

            <div>
              <label className="label">NIT (Opcional)</label>
              <input {...register('nit')} className="input" placeholder="0000-000000-000-0" />
            </div>
          </div>
        </div>

        {/* CONTACTO Y REGIONALIZACIÓN */}
        <div className="card p-6">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-5">Contacto y Geolocalización</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="label">Correo Electrónico</label>
              <input {...register('email')} type="email" className="input" placeholder="ejemplo@correo.com" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Teléfono</label>
              <input {...register('telefono')} className="input" placeholder="+503 0000-0000" />
            </div>

            <div className="md:col-span-2">
              <label className="label">Dirección Fiscal / Sede</label>
              <input {...register('direccion')} className="input" placeholder="Calle, Número, Colonia..." />
            </div>

            <div>
              <label className="label">Departamento</label>
              <select {...register('departamento')} className="input">
                <option value="">Seleccione...</option>
                <option value="San Salvador">San Salvador</option>
                <option value="La Libertad">La Libertad</option>
                <option value="Santa Ana">Santa Ana</option>
                <option value="San Miguel">San Miguel</option>
              </select>
            </div>

            <div>
              <label className="label">Municipio</label>
              <input {...register('municipio')} className="input" placeholder="Ej. Antiguo Cuscatlán" />
            </div>
          </div>
        </div>

        {/* NOTAS INTERNAS */}
        <div className="card p-6">
          <h2 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3 mb-5">Anotaciones del CRM</h2>
          <div>
            <textarea 
              {...register('notas')} 
              className="input min-h-[100px] resize-y" 
              placeholder="Notas comerciales, condiciones pactadas, historial relevante..."
            />
          </div>
        </div>

      </form>
    </div>
  )
}
