import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

export function calcularTotales(params: {
  partidas: { subtotal: number; categoria: string }[]
  pctGastosInd: number
  pctUtilidad: number
  pctIva: number
  pctAnticipo: number
}) {
  const { partidas, pctGastosInd, pctUtilidad, pctIva, pctAnticipo } = params
  const materiales = partidas
    .filter(p => p.categoria === 'material')
    .reduce((s, p) => s + p.subtotal, 0)
  const manoObra = partidas
    .filter(p => p.categoria === 'mano_de_obra')
    .reduce((s, p) => s + p.subtotal, 0)
  const otros = partidas
    .filter(p => !['material', 'mano_de_obra'].includes(p.categoria))
    .reduce((s, p) => s + p.subtotal, 0)
  const directos  = materiales + manoObra + otros
  const gastosInd = round2(directos * pctGastosInd / 100)
  const utilidad  = round2(directos * pctUtilidad / 100)
  const antesIva  = directos + gastosInd + utilidad
  const iva       = round2(antesIva * pctIva / 100)
  const total     = antesIva + iva
  const anticipo  = round2(total * pctAnticipo / 100)
  return { materiales, manoObra, otros, directos, gastosInd, utilidad, antesIva, iva, total, anticipo }
}
