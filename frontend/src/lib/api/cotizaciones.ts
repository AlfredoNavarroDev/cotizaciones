import { fetchApi, type PageResponse } from "@/lib/api/client";
import type { Cliente } from "@/lib/api/clientes";
import type { PlanSoporte } from "@/lib/api/planes-soporte";

export type EstadoCotizacion = "BORRADOR" | "ENVIADA" | "ACEPTADA" | "RECHAZADA";
export type MetodoPago = "TRANSFERENCIA" | "YAPE" | "OTRO";

export interface ItemCotizacion {
  id: number;
  nombreFase: string;
  descripcionTecnica: string[];
  plazoSemanas: number;
  rolTarifaId: number | null;
  precioFinal: number;
}

export interface ItemCotizacionInput {
  nombreFase: string;
  descripcionTecnica: string[];
  plazoSemanas: number;
  rolTarifaId: number | null;
  precioFinal: number;
}

export interface Pago {
  id: number;
  monto: number;
  fecha: string;
  metodo: MetodoPago;
  nota: string | null;
}

export interface PagoInput {
  monto: number;
  fecha: string;
  metodo: MetodoPago;
  nota: string;
}

export interface Cotizacion {
  id: number;
  numero: string;
  fecha: string;
  cliente: Cliente;
  validezDias: number;
  moneda: string;
  incluyeIGV: boolean;
  estado: EstadoCotizacion;
  planSoporte: PlanSoporte | null;
  tarifaSoporteFueraGarantia: number | null;
  notasCostosNoIncluidos: string | null;
  items: ItemCotizacion[];
  pagos: Pago[];
  subtotal: number;
  igv: number;
  total: number;
  montoPagado: number;
  saldoPendiente: number;
}

export interface CotizacionInput {
  clienteId: number;
  validezDias: number;
  incluyeIGV: boolean;
  estado: EstadoCotizacion | null;
  planSoporteId: number | null;
  tarifaSoporteFueraGarantia: number | null;
  notasCostosNoIncluidos: string;
  items: ItemCotizacionInput[];
}

export function listarCotizaciones(page: number, size = 20): Promise<PageResponse<Cotizacion>> {
  return fetchApi<PageResponse<Cotizacion>>(`/api/cotizaciones?page=${page}&size=${size}&sort=fecha,desc`);
}

export function obtenerCotizacion(id: number): Promise<Cotizacion> {
  return fetchApi<Cotizacion>(`/api/cotizaciones/${id}`);
}

export function crearCotizacion(data: CotizacionInput): Promise<Cotizacion> {
  return fetchApi<Cotizacion>("/api/cotizaciones", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function actualizarCotizacion(id: number, data: CotizacionInput): Promise<Cotizacion> {
  return fetchApi<Cotizacion>(`/api/cotizaciones/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function eliminarCotizacion(id: number): Promise<void> {
  return fetchApi<void>(`/api/cotizaciones/${id}`, {
    method: "DELETE",
  });
}

export function agregarPago(cotizacionId: number, data: PagoInput): Promise<Pago> {
  return fetchApi<Pago>(`/api/cotizaciones/${cotizacionId}/pagos`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function eliminarPago(id: number): Promise<void> {
  return fetchApi<void>(`/api/pagos/${id}`, {
    method: "DELETE",
  });
}
