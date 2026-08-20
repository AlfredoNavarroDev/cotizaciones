"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { actualizarRol, type RolTarifa } from "@/lib/api/tarifario";

export function ToggleActivoButton({ rol }: { rol: RolTarifa }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);

  async function handleToggle() {
    setGuardando(true);
    try {
      await actualizarRol(rol.id, {
        nombre: rol.nombre,
        tarifaMinima: rol.tarifaMinima,
        tarifaMaxima: rol.tarifaMaxima,
        activo: !rol.activo,
      });
      router.refresh();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleToggle} disabled={guardando}>
      {rol.activo ? "Desactivar" : "Activar"}
    </Button>
  );
}
