# ContruYA — SaaS de Construcción para El Salvador

MVP de gestión de obras, cotizaciones y clientes para constructoras salvadoreñas.

## Stack
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Estilos**: Tailwind CSS
- **Base de datos**: Supabase (PostgreSQL)
- **Formularios**: React Hook Form + Zod
- **Deploy**: Vercel

## Configuración

### 1. Variables de entorno
Crea `.env.local` en la raíz:
```
NEXT_PUBLIC_SUPABASE_URL=https://idpqeviidafxyhyxlpfb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
NEXT_PUBLIC_APP_NAME=ContruYA
```

### 2. Instalar y correr
```bash
npm install
npm run dev
```

### 3. Deploy en Vercel
- Conecta este repo en vercel.com
- Agrega las variables de entorno en Settings → Environment Variables
- Push a `main` → deploy automático

## Módulos del MVP
- ✅ **Cotizaciones**: formulario con banco de precios SV, IVA 13%, totales automáticos
- 🔜 **Obras**: gestión de fases, tareas y bitácora fotográfica
- 🔜 **Clientes**: CRM básico con historial de proyectos
- 🔜 **Banco de Precios**: 50 materiales y M.O. precargados de EPA/Vidrí
