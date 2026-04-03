# AGENTS.md — Construya / ContruYA

SaaS de gestión para constructoras en El Salvador. MVP de cotizaciones, obras, clientes y banco de precios.

## Commands

```bash
npm run dev       # Start dev server (localhost:3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint (next lint)
```

No test framework is configured. To add tests, use Vitest + React Testing Library.
To run a single test (once installed): `npx vitest <file-pattern>`

## Project Structure

```
src/
  app/                    # Next.js 15 App Router
    layout.tsx            # Root layout (html, body, metadata)
    page.tsx              # Landing page → redirects to /dashboard
    globals.css           # Tailwind + @layer components classes
    dashboard/
      layout.tsx          # Dashboard shell (sidebar + nav, client component)
      page.tsx            # Dashboard home (stats cards + quick links)
      cotizaciones/       # Quotes module (only functional module)
        page.tsx          # List view (fetches from Supabase)
        nueva/page.tsx    # New quote form (client component, RHF + Zod)
      obras/              # Construction sites (placeholder)
      clientes/           # CRM (placeholder)
      banco/              # Price bank (placeholder)
      configuracion/      # Settings (placeholder)
  lib/
    supabase.ts           # createClient() → Supabase browser client
    utils.ts              # cn(), formatUSD(), calcularTotales()
  types/
    index.ts              # All interfaces and type aliases (barrel file)
```

## Code Style

### Imports
- Use `@/*` path alias for all internal imports (`@/lib/utils`, `@/types`, etc.)
- Use `import type { X }` for type-only imports
- Group imports in order: Next.js → React → third-party → internal (`@/`)
- Default import Next.js utilities: `import Link from 'next/link'`
- Named import from lucide-react: `import { IconName } from 'lucide-react'`
- Example:
  ```tsx
  'use client'
  import { useState, useEffect } from 'react'
  import { useForm, useFieldArray } from 'react-hook-form'
  import { zodResolver } from '@hookform/resolvers/zod'
  import { z } from 'zod'
  import { Plus, Save } from 'lucide-react'
  import Link from 'next/link'
  import { createClient } from '@/lib/supabase'
  import { formatUSD, calcularTotales } from '@/lib/utils'
  import type { BancoPrecio } from '@/types'
  ```

### Formatting
- 2-space indentation
- Double quotes for strings (JSX uses double quotes for attributes)
- Semicolons required
- Trailing commas in multi-line objects/arrays
- Max line length: follow editor default (Prettier not configured)

### Naming
- Components: PascalCase (`AreaPartidas`, `DashboardPage`, `NuevaCotizacionPage`)
- Sub-components: PascalCase, defined in same file, not exported (`Row`, `AreaPartidas`)
- Functions/utilities: camelCase (`calcularTotales`, `formatUSD`, `cn`)
- Types/interfaces: PascalCase (`BancoPrecio`, `Cotizacion`, `CategoriaPartida`)
- Enum-like unions: PascalCase type aliases (`EstadoCotizacion`, `RolUsuario`)
- Constants: UPPER_SNAKE_CASE (`CATEGORIAS`, `UNIDADES`)
- State variables: camelCase, Spanish preferred (`guardando`, `areaActiva`, `busqueda`)
- Form fields: snake_case (`cliente_nombre`, `fecha_emision`, `pct_utilidad`)
- Files: kebab-case for dirs, `page.tsx` / `layout.tsx` for Next.js routes
- Page components: `export default function Page()` or descriptive name

### Components
- Server components by default; add `'use client'` only when using hooks
- Use `export default function` for page and layout components
- Keep sub-components in the same file when tightly coupled (not exported)
- Placeholder modules show "Módulo en construcción" with icon in centered card:
  ```tsx
  export default function Page() {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="card p-12 text-center">
          <HardHat className="w-7 h-7 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-700 font-medium mb-1">Módulo en construcción</p>
          <p className="text-gray-400 text-sm">Próxima versión del MVP</p>
        </div>
      </div>
    )
  }
  ```

### Types
- Centralize all types in `src/types/index.ts`
- Use string literal unions for enums: `'material' | 'mano_de_obra' | 'equipo'`
- Mark optional DB fields with `?`
- All `id` fields are `string` type
- Infer form types from Zod: `type FormValues = z.infer<typeof schema>`

### Forms
- Use React Hook Form + Zod resolver for all forms
- Define Zod schemas inline in the component file
- Use `z.coerce.number()` for numeric inputs
- Display validation errors inline below each field:
  ```tsx
  {errors.titulo && <p className="text-red-500 text-xs mt-1">{errors.titulo.message}</p>}
  ```
- Use `useFieldArray` for dynamic/repeatable field groups (areas, partidas)
- Use boolean loading state for submissions (`guardando`)

### Styling
- Tailwind CSS only — no CSS modules, no styled-components, no inline styles
- Use `cn()` from `@/lib/utils` for conditional class merging
- Custom component classes in `globals.css` (`@layer components`):
  `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.input`, `.label`, `.card`, `.badge-*`
- Brand colors: `brand-50/100/500/700/900`, Accent: `accent-400/600`
- Page layout: `p-6 max-w-5xl mx-auto` (or `max-w-6xl` for wide forms)
- Responsive grids: `grid grid-cols-2 lg:grid-cols-4 gap-4`
- Two-column forms: `grid grid-cols-1 lg:grid-cols-3 gap-6` with `lg:col-span-2`

### Data Fetching
- Supabase browser client via `createClient()` from `@/lib/supabase`
- Client-side fetching in `useEffect` with `.from().select().then()` chains
- No `async/await` for data fetching — use Promise `.then()` style
- Cast results to known types: `data as BancoPrecio[]`
- No global state management — use `useState` for local state
- Use `localStorage` for draft persistence

### Error Handling
- Form errors: display via `errors.fieldName.message`
- Async operations: use boolean loading state (e.g., `guardando`)
- Supabase errors: check `error` in `.then(({ data, error }) => ...)`
- No error boundaries or `error.tsx` files yet

### Language
- UI text in Spanish (El Salvador locale)
- IVA: 13%, currency: USD (`es-SV` locale via `formatUSD`)
- Phone format: `+503 XXXX-XXXX`
- References to local suppliers: EPA, Vidrí, Freund
