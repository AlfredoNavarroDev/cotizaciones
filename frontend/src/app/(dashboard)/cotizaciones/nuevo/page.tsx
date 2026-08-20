import { listarClientes } from "@/lib/api/clientes";
import { listarTarifario } from "@/lib/api/tarifario";
import { listarPlanesSoporte } from "@/lib/api/planes-soporte";
import { CotizacionForm } from "@/components/cotizaciones/cotizacion-form";

// Sin searchParams/params que fuercen render dinámico automáticamente — mismo caso que
// /tarifario y /planes-soporte.
export const dynamic = "force-dynamic";

export default async function NuevaCotizacionPage() {
  const [clientesPage, roles, planes] = await Promise.all([
    listarClientes(0, 500),
    listarTarifario(),
    listarPlanesSoporte(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-foreground">Nueva cotización</h1>
      <CotizacionForm clientes={clientesPage.content} roles={roles} planes={planes} />
    </div>
  );
}
