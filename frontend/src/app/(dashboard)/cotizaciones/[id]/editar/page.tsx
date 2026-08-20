import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { obtenerCotizacion } from "@/lib/api/cotizaciones";
import { listarClientes } from "@/lib/api/clientes";
import { listarTarifario } from "@/lib/api/tarifario";
import { listarPlanesSoporte } from "@/lib/api/planes-soporte";
import { CotizacionForm } from "@/components/cotizaciones/cotizacion-form";

export default async function EditarCotizacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let cotizacion;
  try {
    cotizacion = await obtenerCotizacion(Number(id));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  const [clientesPage, roles, planes] = await Promise.all([
    listarClientes(0, 500),
    listarTarifario(),
    listarPlanesSoporte(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-foreground">Editar cotización {cotizacion.numero}</h1>
      <CotizacionForm cotizacion={cotizacion} clientes={clientesPage.content} roles={roles} planes={planes} />
    </div>
  );
}
