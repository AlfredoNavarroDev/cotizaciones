export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

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

// En Docker Compose, el browser y el server-side de Next.js resuelven "backend" distinto:
// el browser necesita NEXT_PUBLIC_API_URL (localhost:8080, publicado al host), pero código
// server-side (Server Components) corre DENTRO del contenedor del frontend, donde localhost
// se refiere al contenedor mismo, no al backend — necesita el hostname interno de compose
// (API_URL_INTERNAL=http://backend:8080). Fuera de Docker (`npm run dev` local) no se define
// API_URL_INTERNAL y ambos casos caen a NEXT_PUBLIC_API_URL.
function apiBaseUrl(): string {
  if (typeof window === "undefined") {
    return process.env.API_URL_INTERNAL ?? process.env.NEXT_PUBLIC_API_URL ?? "";
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "";
}

// Transporte genérico hacia el backend — nunca lógica de negocio acá.
// Cada subsistema define sus propias funciones tipadas sobre este helper
// (ver docs/superpowers/specs/2026-08-19-frontend-shell-design.md §4).
export async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${apiBaseUrl()}${path}`, {
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
