import { PlanSoporteForm } from "@/components/planes-soporte/plan-soporte-form";

export default function NuevoPlanPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-foreground">Nuevo plan de soporte</h1>
      <PlanSoporteForm />
    </div>
  );
}
