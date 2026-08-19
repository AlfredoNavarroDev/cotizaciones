# Frontend — shell base — Diseño

## 1. Resumen

Primer subsistema del frontend del cotizador: la estructura base (layout, navegación, cliente API, manejo de errores) sobre la que se construyen los subsistemas de contenido (Clientes, Tarifario, Planes de Soporte, Cotizaciones, Configuración de emisor), cada uno con su propio sub-spec.

Ver diseño general del proyecto: `docs/superpowers/specs/2026-08-16-cotizador-design.md`.

## 2. Alcance

**Incluye:**
- Layout de dashboard con sidebar fijo a la izquierda y las 5 secciones del sistema.
- Páginas placeholder para cada sección (contenido real fuera de alcance — sub-spec propio).
- `/` redirige a `/cotizaciones` (sección principal).
- Cliente API genérico (`lib/api/client.ts`) para llamar al backend REST.
- Manejo de error/loading a nivel de layout del dashboard.
- Setup de shadcn/ui (init + primitivas mínimas para el nav).

**No incluye:**
- CRUD real de ninguna entidad (Clientes, Tarifario, Planes de Soporte, Cotizaciones, Configuración) — cada uno es un sub-spec posterior que consume este shell y el cliente API.
- Generación de PDF.
- Tests automatizados (spec general §8: frontend es verificación manual).

## 3. Arquitectura

Next.js App Router, Server Components por defecto. Route group `(dashboard)` envuelve todas las secciones:

```
frontend/src/app/
├── layout.tsx                  ← root layout (ya existe, fuentes/globals)
├── page.tsx                    ← redirect a /cotizaciones
├── (dashboard)/
│   ├── layout.tsx               ← sidebar + contenido, error.tsx, loading.tsx
│   ├── cotizaciones/page.tsx    ← placeholder
│   ├── clientes/page.tsx        ← placeholder
│   ├── tarifario/page.tsx       ← placeholder
│   ├── planes-soporte/page.tsx  ← placeholder
│   └── configuracion/page.tsx   ← placeholder
├── components/
│   ├── ui/                      ← primitivas shadcn (button, separator, ...)
│   └── sidebar.tsx              ← nav propio, client component (usePathname)
└── lib/
    └── api/
        └── client.ts             ← fetchApi<T> + ApiError
```

Cada página placeholder muestra el nombre de la sección y un texto "Próximamente" — sirve para validar que el routing y el layout funcionan antes de construir contenido real encima.

## 4. Cliente API

`lib/api/client.ts` expone `fetchApi<T>(path: string, options?: RequestInit): Promise<T>`:

- Antepone `process.env.NEXT_PUBLIC_API_URL` (`http://localhost:8080`, ya en `.env.local`) al `path`.
- Header `Content-Type: application/json` por defecto en requests con body.
- Si la respuesta no es 2xx: parsea el body como `{ mensaje: string, errores?: Record<string,string> }` (forma de `ErrorResponse` del backend, ver `cotizador-backend/.../exception/ErrorResponse.java`) y lanza `ApiError` (clase propia con `mensaje` y `errores`).
- Sin lógica de negocio ni caché — solo transporte. Cada subsistema define sus propias funciones tipadas (`getClientes()`, `crearCliente()`, etc.) sobre este helper, en su propio sub-spec.

## 5. Componentes / shadcn

- `npx shadcn init -d` sobre el Tailwind v4 ya instalado. **Nota de implementación:** la versión de la CLI usada (`shadcn@4.18.0`) ya no soporta forzar `--style`/`--base-color` (deprecados en CLI v4) — los defaults de `-d` resultaron en `style: "base-nova"`, `baseColor: "neutral"` en vez de `new-york`/`zinc` planeados originalmente. Se aceptó el default real de la herramienta en vez de pelear contra flags removidos.
- Primitivas instaladas en este subsistema: `button`, `separator` (lo mínimo que necesita el sidebar).
- El resto de primitivas (`table`, `dialog`, `form`, `input`, etc.) se instalan cuando el sub-spec que las necesita las pide — no se preinstala todo de una.
- `Sidebar` (`components/sidebar.tsx`): client component, lista las 5 secciones con sus rutas, resalta la activa comparando con `usePathname()`.
- Tema claro/oscuro con toggle: `next-themes` (`ThemeProvider attribute="class"`) + botón de toggle en el sidebar. Paleta base `neutral` (ver nota de implementación arriba), un solo color de acento vía `--color-primary` (default de shadcn).
- Gotcha conocido: `shadcn init` sobreescribe `globals.css` y puede introducir `--font-sans: var(--font-sans)` (referencia circular que rompe Geist en Tailwind v4). Después del init, reemplazar por nombres literales (`--font-sans: "Geist", ...`) y mover las clases de variable de fuente de `<body>` a `<html>` en `layout.tsx`.

## 6. Manejo de errores y loading

- `(dashboard)/error.tsx`: boundary de error de Next.js — captura fallos de fetch (ej. backend no está corriendo) con mensaje y botón "Reintentar" (`reset()`).
- `(dashboard)/loading.tsx`: skeleton simple mientras navega entre secciones.

## 7. Testing

Sin suite automatizada (spec general §8). Verificación manual: `npm run dev`, confirmar que las 5 secciones cargan, el nav resalta la sección activa, y que apagar el backend dispara el `error.tsx` en una página que haga fetch.

## 8. Decisiones registradas

- Server Components + `fetch` directo — sin SWR/React Query, app de un solo usuario local no necesita cache/revalidación automática.
- shadcn/ui para componentes — instalado incrementalmente por subsistema, no todo de entrada.
- Sidebar fijo a la izquierda, no header con tabs — escala mejor si se agregan secciones.
- `/cotizaciones` es la landing del dashboard, por ser el núcleo del sistema.
