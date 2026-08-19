# Frontend Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Next.js dashboard shell (sidebar navigation, theme toggle, API client, error/loading boundaries, placeholder pages) that every future frontend subsystem (Clientes, Tarifario, Planes de Soporte, Cotizaciones, Configuración) builds on top of.

**Architecture:** App Router with a `(dashboard)` route group wrapping all 5 sections behind a shared layout with a fixed left sidebar. Server Components by default; `usePathname`/`useTheme`/interactive bits are isolated into small Client Components. A single `fetchApi<T>` helper in `lib/api/client.ts` is the only place that knows how to talk to the backend — no resource-specific logic lives here.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, shadcn/ui (`new-york` style, `zinc` base), `next-themes` for light/dark toggle.

**Spec:** `docs/superpowers/specs/2026-08-19-frontend-shell-design.md` (and general project spec `docs/superpowers/specs/2026-08-16-cotizador-design.md`)

## Global Constraints

- Backend base URL comes from `NEXT_PUBLIC_API_URL` (already set to `http://localhost:8080` in `frontend/.env.local`) — never hardcode it.
- No CRUD logic, no resource-specific API functions (`getClientes()`, etc.) in this plan — those belong to each subsystem's own plan. This plan only produces the generic `fetchApi<T>` transport.
- No automated test suite for the frontend (project spec §8: frontend testing is manual verification against the running app) — every task's "test" step is `npx tsc --noEmit` (or `npm run build`) plus a manual check in the browser, not a Jest/RTL test file.
- **Never run `git commit`, `git add -A`, or create branches.** Project CLAUDE.md forbids the assistant from committing. Every "Commit" step below means: stage the specific files, then print the Conventional Commits message for the user to run themselves — do not execute the commit.
- Follow the shadcn font gotcha fix in Task 1 exactly — skipping it silently breaks the Geist font after `shadcn init`.
- All new UI text is in Spanish (matches the rest of the app: "Cotizaciones", "Clientes", "Próximamente", etc.).

---

### Task 1: Install dependencies, init shadcn, fix font gotcha

**Files:**
- Modify: `frontend/package.json` (via npm install)
- Create: `frontend/components.json` (via shadcn init)
- Create: `frontend/src/lib/utils.ts` (via shadcn init — `cn()` helper)
- Create: `frontend/src/components/ui/button.tsx` (via shadcn add)
- Create: `frontend/src/components/ui/separator.tsx` (via shadcn add)
- Modify: `frontend/src/app/globals.css` (shadcn init rewrites this — verify/fix after)

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` from `@/lib/utils`, used by every component from here on.
- Produces: `<Button>` (`@/components/ui/button`) and `<Separator>` (`@/components/ui/separator`), used in Task 4 (Sidebar) and Task 5 (error.tsx).

- [ ] **Step 1: Install next-themes**

Run (from `frontend/`):
```bash
npm install next-themes
```
Expected: `next-themes` added to `dependencies` in `package.json`.

- [ ] **Step 2: Run shadcn init non-interactively**

Run (from `frontend/`):
```bash
npx shadcn@latest init -d
```
Expected: creates `components.json`, `src/lib/utils.ts`, rewrites `src/app/globals.css` with shadcn's CSS variables (`--color-background`, `--color-primary`, etc., `new-york` style, `zinc` base color — these are the `-d` defaults).

- [ ] **Step 3: Fix the Geist font gotcha in globals.css**

Open `frontend/src/app/globals.css`. Inside the `@theme inline { ... }` block, find the `--font-sans` and `--font-mono` lines. If they read exactly `--font-sans: var(--font-sans);` (self-referential — this is the bug), replace with literal font names:

```css
--font-sans: "Geist", "Geist Fallback", ui-sans-serif, system-ui, sans-serif;
--font-mono: "Geist Mono", "Geist Mono Fallback", ui-monospace, monospace;
```

If shadcn instead preserved `var(--font-geist-sans)` / `var(--font-geist-mono)` (the pattern already in the file before this task), leave it as-is — that form works. Only fix it if it became the circular `var(--font-sans)` / `var(--font-mono)` form.

- [ ] **Step 4: Add button and separator components**

Run (from `frontend/`):
```bash
npx shadcn@latest add button separator
```
Expected: creates `src/components/ui/button.tsx` and `src/components/ui/separator.tsx`.

- [ ] **Step 5: Verify it builds**

Run (from `frontend/`):
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 6: Stage and prepare commit**

Stage: `package.json`, `package-lock.json`, `components.json`, `src/lib/utils.ts`, `src/components/ui/button.tsx`, `src/components/ui/separator.tsx`, `src/app/globals.css`.

Print this message for the user to run themselves (do not run it):
```
feat: init shadcn/ui and add next-themes dependency
```

---

### Task 2: API client (`fetchApi` + `ApiError`)

**Files:**
- Create: `frontend/src/lib/api/client.ts`

**Interfaces:**
- Produces: `class ApiError extends Error { status: number; errores?: Record<string, string> }` and `function fetchApi<T>(path: string, options?: RequestInit): Promise<T>`. Every future subsystem's data-fetching functions call `fetchApi`.
- Consumes: `process.env.NEXT_PUBLIC_API_URL`.

- [ ] **Step 1: Write the API client**

Create `frontend/src/lib/api/client.ts`:

```ts
export class ApiError extends Error {
  status: number;
  errores?: Record<string, string>;

  constructor(status: number, mensaje: string, errores?: Record<string, string>) {
    super(mensaje);
    this.name = "ApiError";
    this.status = status;
    this.errores = errores;
  }
}

// Transporte genérico hacia el backend — nunca lógica de negocio acá.
// Cada subsistema define sus propias funciones tipadas sobre este helper
// (ver docs/superpowers/specs/2026-08-19-frontend-shell-design.md §4).
export async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    let mensaje = `Error ${res.status}`;
    let errores: Record<string, string> | undefined;
    try {
      const body = await res.json();
      mensaje = body.mensaje ?? mensaje;
      errores = body.errores ?? undefined;
    } catch {
      // Respuesta sin body JSON (ej. backend caído del todo, timeout de red).
    }
    throw new ApiError(res.status, mensaje, errores);
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}
```

- [ ] **Step 2: Verify it compiles**

Run (from `frontend/`):
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Stage and prepare commit**

Stage: `src/lib/api/client.ts`.

Print this message for the user to run themselves (do not run it):
```
feat: add generic API client for backend requests
```

---

### Task 3: Root layout with theme provider

**Files:**
- Create: `frontend/src/components/theme-provider.tsx`
- Modify: `frontend/src/app/layout.tsx`

**Interfaces:**
- Produces: `<ThemeProvider>` (`@/components/theme-provider`), used only in `app/layout.tsx`.
- Consumes: `Button` is NOT used here — this task is layout-only.

- [ ] **Step 1: Create the theme provider wrapper**

`next-themes`'s `ThemeProvider` must run in a Client Component, but `app/layout.tsx` is a Server Component — this file is the bridge.

Create `frontend/src/components/theme-provider.tsx`:

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

- [ ] **Step 2: Wrap the root layout**

Modify `frontend/src/app/layout.tsx` to the following (adds `ThemeProvider`, `suppressHydrationWarning` on `<html>` as required by `next-themes`, Spanish `lang`, and app-specific metadata):

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cotizador",
  description: "Cotizaciones de proyectos de software",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run (from `frontend/`):
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Stage and prepare commit**

Stage: `src/components/theme-provider.tsx`, `src/app/layout.tsx`.

Print this message for the user to run themselves (do not run it):
```
feat: wire up next-themes provider in root layout
```

---

### Task 4: Nav config, Sidebar, ThemeToggle

**Files:**
- Create: `frontend/src/lib/nav.ts`
- Create: `frontend/src/components/theme-toggle.tsx`
- Create: `frontend/src/components/sidebar.tsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils` (Task 1), `Button` from `@/components/ui/button` (Task 1), `Separator` from `@/components/ui/separator` (Task 1).
- Produces: `NAV_ITEMS: { href: string; label: string }[]` from `@/lib/nav`, `<ThemeToggle>` from `@/components/theme-toggle`, `<Sidebar>` from `@/components/sidebar` — consumed by Task 5's dashboard layout.

- [ ] **Step 1: Define the nav items**

Create `frontend/src/lib/nav.ts`:

```ts
export const NAV_ITEMS = [
  { href: "/cotizaciones", label: "Cotizaciones" },
  { href: "/clientes", label: "Clientes" },
  { href: "/tarifario", label: "Tarifario" },
  { href: "/planes-soporte", label: "Planes de Soporte" },
  { href: "/configuracion", label: "Mis Datos" },
] as const;
```

- [ ] **Step 2: Build the theme toggle button**

Create `frontend/src/components/theme-toggle.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Evita mismatch de hidratación: el tema resuelto solo se conoce en cliente.
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" className="w-full" disabled>
        Tema
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {resolvedTheme === "dark" ? "Modo claro" : "Modo oscuro"}
    </Button>
  );
}
```

- [ ] **Step 3: Build the sidebar**

Create `frontend/src/components/sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-card px-3 py-4">
      <span className="px-2 text-sm font-semibold text-foreground">Cotizador</span>
      <Separator className="my-3" />
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-2 py-2 text-sm font-medium transition-colors",
              pathname.startsWith(item.href)
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <Separator className="my-3" />
      <ThemeToggle />
    </aside>
  );
}
```

- [ ] **Step 4: Verify it compiles**

Run (from `frontend/`):
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Stage and prepare commit**

Stage: `src/lib/nav.ts`, `src/components/theme-toggle.tsx`, `src/components/sidebar.tsx`.

Print this message for the user to run themselves (do not run it):
```
feat: add sidebar navigation with theme toggle
```

---

### Task 5: Dashboard route group — layout, error, loading

**Files:**
- Create: `frontend/src/app/(dashboard)/layout.tsx`
- Create: `frontend/src/app/(dashboard)/error.tsx`
- Create: `frontend/src/app/(dashboard)/loading.tsx`

**Interfaces:**
- Consumes: `<Sidebar>` from `@/components/sidebar` (Task 4), `<Button>` from `@/components/ui/button` (Task 1).

- [ ] **Step 1: Build the dashboard layout**

Create `frontend/src/app/(dashboard)/layout.tsx`:

```tsx
import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Build the error boundary**

Create `frontend/src/app/(dashboard)/error.tsx`. Must be a Client Component (Next.js requirement for `error.tsx`):

```tsx
"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-lg font-semibold text-foreground">Algo salió mal</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {error.message ||
          "No se pudo cargar la información. Verificá que el backend esté corriendo en localhost:8080."}
      </p>
      <Button onClick={() => reset()}>Reintentar</Button>
    </div>
  );
}
```

- [ ] **Step 3: Build the loading UI**

Create `frontend/src/app/(dashboard)/loading.tsx`:

```tsx
export default function DashboardLoading() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
    </div>
  );
}
```

- [ ] **Step 4: Verify it compiles**

Run (from `frontend/`):
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Stage and prepare commit**

Stage: `src/app/(dashboard)/layout.tsx`, `src/app/(dashboard)/error.tsx`, `src/app/(dashboard)/loading.tsx`.

Print this message for the user to run themselves (do not run it):
```
feat: add dashboard layout with error and loading boundaries
```

---

### Task 6: Placeholder pages + root redirect

**Files:**
- Create: `frontend/src/app/(dashboard)/cotizaciones/page.tsx`
- Create: `frontend/src/app/(dashboard)/clientes/page.tsx`
- Create: `frontend/src/app/(dashboard)/tarifario/page.tsx`
- Create: `frontend/src/app/(dashboard)/planes-soporte/page.tsx`
- Create: `frontend/src/app/(dashboard)/configuracion/page.tsx`
- Modify: `frontend/src/app/page.tsx`
- Delete: nothing (old `page.tsx` content is fully replaced, not the file)

**Interfaces:**
- None produced — these are leaf pages. Each is replaced wholesale by its subsystem's own plan later.

- [ ] **Step 1: Create the 5 placeholder pages**

Create `frontend/src/app/(dashboard)/cotizaciones/page.tsx`:

```tsx
export default function CotizacionesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Cotizaciones</h1>
      <p className="mt-2 text-sm text-muted-foreground">Próximamente.</p>
    </div>
  );
}
```

Create `frontend/src/app/(dashboard)/clientes/page.tsx`:

```tsx
export default function ClientesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Clientes</h1>
      <p className="mt-2 text-sm text-muted-foreground">Próximamente.</p>
    </div>
  );
}
```

Create `frontend/src/app/(dashboard)/tarifario/page.tsx`:

```tsx
export default function TarifarioPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Tarifario</h1>
      <p className="mt-2 text-sm text-muted-foreground">Próximamente.</p>
    </div>
  );
}
```

Create `frontend/src/app/(dashboard)/planes-soporte/page.tsx`:

```tsx
export default function PlanesSoportePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Planes de Soporte</h1>
      <p className="mt-2 text-sm text-muted-foreground">Próximamente.</p>
    </div>
  );
}
```

Create `frontend/src/app/(dashboard)/configuracion/page.tsx`:

```tsx
export default function ConfiguracionPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Mis Datos</h1>
      <p className="mt-2 text-sm text-muted-foreground">Próximamente.</p>
    </div>
  );
}
```

- [ ] **Step 2: Replace the root page with a redirect**

Replace the full contents of `frontend/src/app/page.tsx` (the `create-next-app` starter content) with:

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/cotizaciones");
}
```

- [ ] **Step 3: Verify it compiles**

Run (from `frontend/`):
```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Stage and prepare commit**

Stage: `src/app/(dashboard)/cotizaciones/page.tsx`, `src/app/(dashboard)/clientes/page.tsx`, `src/app/(dashboard)/tarifario/page.tsx`, `src/app/(dashboard)/planes-soporte/page.tsx`, `src/app/(dashboard)/configuracion/page.tsx`, `src/app/page.tsx`.

Print this message for the user to run themselves (do not run it):
```
feat: add placeholder pages for the 5 dashboard sections
```

---

### Task 7: Manual verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the dev server**

Run (from `frontend/`):
```bash
npm run dev
```
Expected: starts on `http://localhost:3000` without errors.

- [ ] **Step 2: Check the redirect and each section**

Open `http://localhost:3000` in a browser. Confirm:
- It redirects to `/cotizaciones`.
- The sidebar shows all 5 sections with "Cotizaciones" highlighted as active.
- Clicking each of the other 4 links navigates there, shows the right placeholder title, and highlights that link as active.

- [ ] **Step 3: Check the theme toggle**

Click the theme toggle button in the sidebar. Confirm the whole page switches between light and dark (backgrounds, text, sidebar, border colors all flip — not just one element).

- [ ] **Step 4: Check the error boundary**

Stop the backend (or just leave it stopped — this shell has no fetches yet, so there is nothing to break it with directly). Instead, temporarily add `throw new Error("test")` at the top of `frontend/src/app/(dashboard)/cotizaciones/page.tsx`, reload, confirm the `error.tsx` UI renders with the "Reintentar" button, then remove the `throw` line.

- [ ] **Step 5: Run the production build**

Run (from `frontend/`):
```bash
npm run build
```
Expected: `BUILD SUCCESS` equivalent — no type errors, no failed page generation.

- [ ] **Step 6: Report results to the user**

No commit here — this task only verifies Tasks 1-6, whose commits were already staged individually.
