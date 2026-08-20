import { fetchApi } from "@/lib/api/client";

export interface RolTarifa {
  id: number;
  nombre: string;
  tarifaMinima: number;
  tarifaMaxima: number;
  activo: boolean;
}

export interface RolTarifaInput {
  nombre: string;
  tarifaMinima: number;
  tarifaMaxima: number;
  activo: boolean;
}

export function listarTarifario(): Promise<RolTarifa[]> {
  return fetchApi<RolTarifa[]>("/api/tarifario");
}

export function crearRol(data: RolTarifaInput): Promise<RolTarifa> {
  return fetchApi<RolTarifa>("/api/tarifario", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarRol(id: number, data: RolTarifaInput): Promise<RolTarifa> {
  return fetchApi<RolTarifa>(`/api/tarifario/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
