import { fetchApi, type PageResponse } from "@/lib/api/client";

export interface Cliente {
  id: number;
  nombre: string;
  empresa: string | null;
  rucDni: string;
  telefono: string | null;
  email: string | null;
}

export interface ClienteInput {
  nombre: string;
  empresa: string;
  rucDni: string;
  telefono: string;
  email: string;
}

export function listarClientes(page: number, size = 20): Promise<PageResponse<Cliente>> {
  return fetchApi<PageResponse<Cliente>>(`/api/clientes?page=${page}&size=${size}&sort=nombre`);
}

export function obtenerCliente(id: number): Promise<Cliente> {
  return fetchApi<Cliente>(`/api/clientes/${id}`);
}

export function crearCliente(data: ClienteInput): Promise<Cliente> {
  return fetchApi<Cliente>("/api/clientes", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarCliente(id: number, data: ClienteInput): Promise<Cliente> {
  return fetchApi<Cliente>(`/api/clientes/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function eliminarCliente(id: number): Promise<void> {
  return fetchApi<void>(`/api/clientes/${id}`, {
    method: "DELETE",
  });
}
