import { HardHat } from 'lucide-react'
export default function Page() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="card p-12 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <HardHat className="w-7 h-7 text-gray-400" />
        </div>
        <p className="text-gray-700 font-medium mb-1">Módulo en construcción</p>
        <p className="text-gray-400 text-sm">Próxima versión del MVP</p>
      </div>
    </div>
  )
}
