// Garantía y forma de pago son política fija de negocio, no datos de la cotización
// (el modelo del backend no tiene campos para esto) — ver decisión registrada en
// docs/superpowers/specs/2026-08-16-cotizador-design.md §6.
export const GARANTIA_DIAS = 30;

export function formatearFecha(fechaIso: string): string {
  const [anio, mes, dia] = fechaIso.split("-");
  return `${dia}/${mes}/${anio}`;
}

export function formatearMonto(monto: number): string {
  return monto.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function letra(index: number): string {
  return String.fromCharCode(65 + index);
}
