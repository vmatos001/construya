export type CategoriaPartida = 'material' | 'mano_de_obra' | 'equipo' | 'subcontrato' | 'otro'
export type EstadoCotizacion = 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'vencida'
export type EstadoObra = 'planificacion' | 'en_progreso' | 'pausada' | 'completada' | 'cancelada'
export type EstadoTarea = 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada'
export type RolUsuario = 'admin' | 'supervisor' | 'operario'

export interface Empresa {
  id: string
  nombre: string
  nit?: string
  nrc?: string
  email?: string
  telefono?: string
  direccion?: string
  logo_url?: string
  moneda: string
  iva_pct: number
  created_at: string
}

export interface Cliente {
  id: string
  empresa_id: string
  nombre: string
  email?: string
  telefono?: string
  dui?: string
  nit?: string
  direccion?: string
  departamento?: string
  municipio?: string
  tipo: 'persona_natural' | 'empresa'
  estado: 'prospecto' | 'activo' | 'inactivo'
  notas?: string
}

export interface BancoPrecio {
  id: string
  empresa_id?: string
  codigo?: string
  descripcion: string
  unidad: string
  categoria: CategoriaPartida
  subcategoria?: string
  precio_ref: number
  activo: boolean
  fuente?: string
}

export interface CotizacionPartida {
  id?: string
  cotizacion_id?: string
  area_id?: string
  banco_precio_id?: string
  descripcion: string
  unidad: string
  categoria: CategoriaPartida
  cantidad: number
  precio_unitario: number
  factor_desperd: number
  subtotal?: number
  orden?: number
  notas?: string
}

export interface CotizacionArea {
  id?: string
  cotizacion_id?: string
  nombre: string
  orden: number
  partidas?: CotizacionPartida[]
}

export interface Cotizacion {
  id: string
  empresa_id: string
  cliente_id: string
  creado_por?: string
  numero: string
  titulo: string
  descripcion?: string
  referencia?: string
  ubicacion?: string
  departamento?: string
  municipio?: string
  fecha_emision: string
  fecha_validez?: string
  fecha_inicio_est?: string
  fecha_fin_est?: string
  subtotal_materiales: number
  subtotal_mano_obra: number
  subtotal_otros: number
  costos_directos: number
  pct_gastos_indirectos: number
  monto_gastos_ind: number
  pct_utilidad: number
  monto_utilidad: number
  subtotal_antes_iva: number
  pct_iva: number
  monto_iva: number
  total: number
  pct_anticipo: number
  monto_anticipo: number
  pct_pago_final: number
  condiciones_pago?: string
  estado: EstadoCotizacion
  notas_internas?: string
  notas_cliente?: string
  token_publico?: string
  cliente?: Cliente
  areas?: CotizacionArea[]
}

export interface ObraTarea {
  id: string
  obra_id: string
  fase_id?: string
  titulo: string
  descripcion?: string
  responsable?: string
  fecha_inicio?: string
  fecha_limite?: string
  fecha_completada?: string
  estado: EstadoTarea
  prioridad: 'alta' | 'media' | 'baja'
  orden: number
}

export interface ObraFase {
  id: string
  obra_id: string
  nombre: string
  orden: number
  pct_avance: number
  tareas?: ObraTarea[]
}

export interface Obra {
  id: string
  empresa_id: string
  cotizacion_id?: string
  cliente_id: string
  nombre: string
  descripcion?: string
  ubicacion?: string
  departamento?: string
  municipio?: string
  fecha_inicio?: string
  fecha_fin_est?: string
  fecha_fin_real?: string
  estado: EstadoObra
  pct_avance: number
  token_publico?: string
  notas?: string
  cliente?: Cliente
  fases?: ObraFase[]
}
