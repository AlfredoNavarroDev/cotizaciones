import { RolTarifaForm } from "@/components/tarifario/rol-tarifa-form";

export default function NuevoRolPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-foreground">Nuevo rol de tarifario</h1>
      <RolTarifaForm />
    </div>
  );
}
