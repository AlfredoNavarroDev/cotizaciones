import { obtenerConfiguracionEmisor } from "@/lib/api/configuracion-emisor";
import { ConfiguracionEmisorForm } from "@/components/configuracion/configuracion-emisor-form";

// Sin searchParams/params que fuercen render dinámico automáticamente — mismo caso que
// /tarifario, /planes-soporte y /cotizaciones/nuevo.
export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const configuracion = await obtenerConfiguracionEmisor();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Mis Datos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estos datos se usan como emisor en los PDFs de cotización.
        </p>
      </div>
      <ConfiguracionEmisorForm configuracion={configuracion} />
    </div>
  );
}
