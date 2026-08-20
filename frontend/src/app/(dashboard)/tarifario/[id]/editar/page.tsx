import { notFound } from "next/navigation";
import { listarTarifario } from "@/lib/api/tarifario";
import { RolTarifaForm } from "@/components/tarifario/rol-tarifa-form";

export default async function EditarRolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // No hay GET /api/tarifario/{id} en el backend — la lista es chica y plana,
  // así que se pide completa y se filtra acá.
  const roles = await listarTarifario();
  const rol = roles.find((r) => r.id === Number(id));

  if (!rol) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-foreground">Editar rol de tarifario</h1>
      <RolTarifaForm rol={rol} />
    </div>
  );
}
