import { FileText, HardHat, Users, TrendingUp, Plus, ArrowRight, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

const stats = [
  { label: 'Cotizaciones activas', value: '12', icon: FileText,  color: 'badge-mint' },
  { label: 'Obras en progreso',    value: '4',  icon: HardHat,   color: 'badge-purple' },
  { label: 'Clientes nuevos',      value: '28', icon: Users,     color: 'badge-mint' },
  { label: 'Ingresos (Mes)',       value: '$15.4k', icon: TrendingUp, color: 'badge-mint' },
]

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-gray-400 font-medium mt-1">Actualizado hace 1 hora</p>
        </div>
        <Link href="/dashboard/cotizaciones/nueva" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Nueva Cotización
        </Link>
      </div>

      {/* Main Grid: Mimicking the reference image */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Large Dark Card (Stats Reference) */}
        <div className="lg:col-span-8 card-dark p-8 relative overflow-hidden flex flex-col justify-between min-h-[350px]">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <h2 className="text-xl font-medium opacity-80 uppercase tracking-widest text-[10px] text-[#b6f09c] mb-1">Estadísticas</h2>
              <h3 className="text-2xl font-bold">Proyectos en Curso</h3>
              <p className="text-sm opacity-50 mt-1">Semanas de Septiembre - Noviembre</p>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-2xl text-[10px] font-bold border border-white/10 backdrop-blur-md uppercase tracking-wider">
              Mensual ▼
            </div>
          </div>

          <div className="flex items-end justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm opacity-60">Visitantes hoy</span>
                <div className="w-5 h-5 bg-[#b6f09c] rounded-full flex items-center justify-center">
                  <ArrowUpRight className="w-3 h-3 text-[#121212]" />
                </div>
              </div>
              <p className="text-7xl font-bold tracking-tighter">2,350</p>
            </div>
            
            {/* Visual Bar Decoration like in the image */}
            <div className="flex items-end gap-3 mb-2">
              <div className="w-16 h-28 bg-white/5 rounded-2xl flex flex-col justify-end overflow-hidden border border-white/5">
                <div className="h-12 bg-[#b6f09c] w-full rounded-t-xl" />
              </div>
              <div className="w-16 h-36 bg-white/5 rounded-2xl flex flex-col justify-end overflow-hidden border border-white/5">
                <div className="h-20 bg-[#c5beff] w-full rounded-t-xl" />
              </div>
            </div>
          </div>

          {/* Decorative Background Blob */}
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#b6f09c] opacity-20 blur-[100px]" />
        </div>

        {/* Sidebar Info Section */}
        <div className="lg:col-span-4 space-y-6">
          {/* Recent Transactions Style */}
          <div className="card p-6 border-none shadow-sm flex flex-col justify-between h-[160px]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#121212] rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-[#b6f09c]" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Presupuesto</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Control de Gastos</p>
              </div>
            </div>
            <div className="bg-[#f0f3ed] rounded-2xl p-4 flex justify-between items-center border border-gray-100">
              <span className="text-xs font-bold text-gray-700">12,53k USD / Obra</span>
              <div className="w-2 h-2 bg-gray-300 rounded-full" />
            </div>
          </div>

          {/* Current Balance Style */}
          <div className="card p-6 border-none shadow-sm h-[165px] relative overflow-hidden group">
             <div className="flex justify-between items-center mb-6">
                <p className="text-sm font-bold text-gray-900">Balance Actual</p>
                <div className="flex gap-1">
                  <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                    <ArrowRight className="w-4 h-4 text-gray-400 rotate-180" />
                  </div>
                  <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
             </div>
             <div className="bg-[#b6f09c] rounded-2xl p-4 flex items-center justify-between shadow-inner">
                <p className="text-2xl font-bold text-[#121212]">$42,900</p>
                <div className="w-10 h-10 bg-[#121212] rounded-xl flex items-center justify-center shadow-md">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
             </div>
          </div>
        </div>

      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Forecast / Timeline Style */}
        <div className="lg:col-span-7 card p-8 border-none overflow-hidden relative">
          <div className="flex items-center gap-2 mb-8">
             <div className="w-10 h-10 bg-[var(--brand-500)] rounded-xl flex items-center justify-center">
                <HardHat className="w-5 h-5 text-[var(--card-dark)]" />
             </div>
             <h3 className="font-bold text-lg">Próximas Entregas</h3>
          </div>
          
          <div className="space-y-6 relative z-10">
            {[2023, 2024, 2025].map((year, i) => (
              <div key={year} className="flex gap-6 items-start group">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm transition-colors ${i === 0 ? 'bg-gray-100' : 'bg-[var(--card-dark)]'}`} />
                  {i !== 2 && <div className="w-0.5 h-12 bg-gray-100" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{year + 2}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Fase {i + 1} del proyecto habitacional</p>
                </div>
              </div>
            ))}
          </div>

          <div className="absolute top-0 right-0 p-8 h-full flex flex-col justify-center gap-4">
             <div className="w-32 h-32 bg-[var(--brand-500)] rounded-3xl p-4 flex flex-col justify-between">
                <p className="text-xs font-bold opacity-50">Score</p>
                <div className="h-2 bg-black/10 rounded-full overflow-hidden">
                   <div className="w-2/3 h-full bg-black/20" />
                </div>
                <p className="text-2xl font-bold">85%</p>
             </div>
             <div className="w-32 h-32 bg-[var(--accent-purple)] rounded-3xl p-4 flex flex-col justify-between">
                <p className="text-xs font-bold opacity-50">Market</p>
                <p className="text-xl font-bold">1,3trln$</p>
                <div className="h-6 w-full opacity-30 border-b border-black/20 rounded-full" />
             </div>
          </div>
        </div>

        {/* Small Action Cards */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
           {stats.slice(0, 4).map((s) => (
             <div key={s.label} className="card p-6 border-none flex flex-col justify-between group hover:bg-[var(--brand-500)] transition-colors cursor-pointer">
                <div className="flex justify-between items-start">
                  <div className={`w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center transition-colors group-hover:bg-white`}>
                    <s.icon className="w-5 h-5 text-gray-900" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-[var(--card-dark)]" />
                </div>
                <div>
                  <p className="text-2xl font-bold mt-4 tracking-tighter group-hover:text-[var(--card-dark)]">{s.value}</p>
                  <p className="text-xs font-medium text-gray-400 group-hover:text-[var(--card-dark)]/60">{s.label}</p>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  )
}
