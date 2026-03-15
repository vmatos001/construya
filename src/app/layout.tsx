import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ContruYA — Gestión de Construcción',
  description: 'Presupuestos, obras y clientes para constructoras de El Salvador',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
