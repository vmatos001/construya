'use client'
import Link from 'next/link'
import { Plus, Users, Building2, UserCircle, Activity, Mail } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Cliente } from '@/types'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [cargando, setCargando] = useState(true)

  const [metricas, setMetricas] = useState({
    total: 0,
    activos: 0,
    prospectos: 0,
    empresas: 0
  })

  useEffect(() => {
    fetchClientes()
  }, [])

  async function fetchClientes() {
    setCargando(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('clientes').select('*').order('nombre', { ascending: true })
    
    if (data) {
      setClientes(data as Cliente[])
      setMetricas({
        total: data.length,
        activos: data.filter(c => c.estado === 'activo').length,
        prospectos: data.filter(c => c.estado === 'prospecto').length,
        empresas: data.filter(c => c.tipo === 'empresa').length
      })
    }
    setCargando(false)
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* HEADER */}
      <div className="flex items-end justify-between pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Directorio de Clientes</h1>
          <p className="text-gray-400 font-medium mt-1">Gestión comercial y CRM</p>
        </div>
        <Link href="/dashboard/clientes/nuevo" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nuevo cliente
        </Link>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Clientes', value: metricas.total, icon: Users, color: 'text-gray-500', bg: 'bg-white text-gray-700' },
          { label: 'Activos', value: metricas.activos, icon: Activity, color: 'text-[#121212]', bg: 'bg-[#b6f09c]/40 text-[#121212]' },
          { label: 'Prospectos', value: metricas.prospectos, icon: UserCircle, color: 'text-purple-500', bg: 'bg-purple-50 text-purple-700' },
          { label: 'Corp / Empresas', value: metricas.empresas, icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50 text-blue-700' },
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
            {m.label === 'Activos' && (
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-[#b6f09c] rounded-full blur-[20px] opacity-30" />
            )}
          </div>
        ))}
      </div>

      {/* LISTA */}
      <div className="card shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Nombre / Razón Social</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Contacto</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Tipo</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {cargando ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">Cargando datos desde la bóveda segura...</td>
                </tr>
              ) : clientes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-[#edf2ea] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-[#b6f09c]" />
                    </div>
                    <p className="text-gray-900 font-bold mb-1">Sin clientes registrados</p>
                    <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">Tu cartera de clientes está vacía. Añade tu primer prospecto para comenzar.</p>
                    <Link href="/dashboard/clientes/nuevo" className="text-xs bg-[#121212] text-white px-5 py-2.5 rounded-full font-bold">
                      Registrar primer cliente
                    </Link>
                  </td>
                </tr>
              ) : clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900 group-hover:text-black">{cliente.nombre}</p>
                    {(cliente.nit || cliente.dui) && (
                      <p className="text-[10px] text-gray-400 uppercase font-medium tracking-wider mt-0.5 flex gap-2">
                        {cliente.nit && <span>NIT: {cliente.nit}</span>}
                        {cliente.dui && <span>DUI: {cliente.dui}</span>}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 items-start">
                      {cliente.email && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {cliente.email}
                        </div>
                      )}
                      {cliente.telefono && (
                        <span className="inline-flex items-center bg-gray-100 text-[#121212] px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1 w-fit">
                          {cliente.telefono}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className="text-xs text-gray-500 font-semibold bg-white border border-gray-100 shadow-sm px-2.5 py-1 rounded-lg">
                        {cliente.tipo === 'empresa' ? 'Corporativo' : 'Natural'}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      cliente.estado === 'activo' ? 'bg-[#b6f09c] text-[#121212]' :
                      cliente.estado === 'prospecto' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-500' 
                    }`}>
                      {cliente.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
