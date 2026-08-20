import { Badge } from "@/components/ui/badge";
import type { EstadoCotizacion } from "@/lib/api/cotizaciones";

const VARIANTS: Record<EstadoCotizacion, "default" | "secondary" | "destructive" | "outline"> = {
  BORRADOR: "secondary",
  ENVIADA: "outline",
  ACEPTADA: "default",
  RECHAZADA: "destructive",
};

const LABELS: Record<EstadoCotizacion, string> = {
  BORRADOR: "Borrador",
  ENVIADA: "Enviada",
  ACEPTADA: "Aceptada",
  RECHAZADA: "Rechazada",
};

export function EstadoBadge({ estado }: { estado: EstadoCotizacion }) {
  return <Badge variant={VARIANTS[estado]}>{LABELS[estado]}</Badge>;
}
