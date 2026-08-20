"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { actualizarPlan, type PlanSoporte } from "@/lib/api/planes-soporte";

export function ToggleActivoButton({ plan }: { plan: PlanSoporte }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);

  async function handleToggle() {
    setGuardando(true);
    try {
      await actualizarPlan(plan.id, {
        nombre: plan.nombre,
        descripcion: plan.descripcion ?? "",
        precioMensual: plan.precioMensual,
        activo: !plan.activo,
      });
      router.refresh();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleToggle} disabled={guardando}>
      {plan.activo ? "Desactivar" : "Activar"}
    </Button>
  );
}
