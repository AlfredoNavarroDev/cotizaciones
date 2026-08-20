import { notFound } from "next/navigation";
import { listarPlanesSoporte } from "@/lib/api/planes-soporte";
import { PlanSoporteForm } from "@/components/planes-soporte/plan-soporte-form";

export default async function EditarPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // No hay GET /api/planes-soporte/{id} en el backend — la lista es chica y plana,
  // así que se pide completa y se filtra acá (mismo patrón que /tarifario).
  const planes = await listarPlanesSoporte();
  const plan = planes.find((p) => p.id === Number(id));

  if (!plan) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-foreground">Editar plan de soporte</h1>
      <PlanSoporteForm plan={plan} />
    </div>
  );
}
