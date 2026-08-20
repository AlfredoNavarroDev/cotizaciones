import { fetchApi } from "@/lib/api/client";

export interface ConfiguracionEmisor {
  id: number;
  nombreRazonSocial: string;
  rucDni: string;
  telefono: string;
  email: string;
  direccion: string | null;
}

export interface ConfiguracionEmisorInput {
  nombreRazonSocial: string;
  rucDni: string;
  telefono: string;
  email: string;
  direccion: string;
}

export function obtenerConfiguracionEmisor(): Promise<ConfiguracionEmisor> {
  return fetchApi<ConfiguracionEmisor>("/api/configuracion-emisor");
}

export function actualizarConfiguracionEmisor(
  data: ConfiguracionEmisorInput
): Promise<ConfiguracionEmisor> {
  return fetchApi<ConfiguracionEmisor>("/api/configuracion-emisor", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
