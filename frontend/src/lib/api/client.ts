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
