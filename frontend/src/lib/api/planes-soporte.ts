import { fetchApi } from "@/lib/api/client";

export interface PlanSoporte {
  id: number;
  nombre: string;
  descripcion: string | null;
  precioMensual: number;
  activo: boolean;
}

export interface PlanSoporteInput {
  nombre: string;
  descripcion: string;
  precioMensual: number;
  activo: boolean;
}

export function listarPlanesSoporte(): Promise<PlanSoporte[]> {
  return fetchApi<PlanSoporte[]>("/api/planes-soporte");
}

export function crearPlan(data: PlanSoporteInput): Promise<PlanSoporte> {
  return fetchApi<PlanSoporte>("/api/planes-soporte", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarPlan(id: number, data: PlanSoporteInput): Promise<PlanSoporte> {
  return fetchApi<PlanSoporte>(`/api/planes-soporte/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
