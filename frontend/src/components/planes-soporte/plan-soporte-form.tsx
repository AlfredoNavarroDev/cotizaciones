"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import {
  crearPlan,
  actualizarPlan,
  type PlanSoporte,
  type PlanSoporteInput,
} from "@/lib/api/planes-soporte";

export function PlanSoporteForm({ plan }: { plan?: PlanSoporte }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(plan?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(plan?.descripcion ?? "");
  const [precioMensual, setPrecioMensual] = useState(plan ? String(plan.precioMensual) : "");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [erroresCampo, setErroresCampo] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    setErroresCampo({});

    const data: PlanSoporteInput = {
      nombre,
      descripcion,
      precioMensual: Number(precioMensual),
      activo: plan?.activo ?? true,
    };

    try {
      if (plan) {
        await actualizarPlan(plan.id, data);
      } else {
        await crearPlan(data);
      }
      router.push("/planes-soporte");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setMensaje(err.message);
        setErroresCampo(err.errores ?? {});
      } else {
        setMensaje("No se pudo guardar el plan.");
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      {mensaje && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {mensaje}
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nombre">Nombre *</Label>
        <Input
          id="nombre"
          value={nombre}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setNombre(e.target.value)}
          required
        />
        {erroresCampo.nombre && <p className="text-sm text-destructive">{erroresCampo.nombre}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="descripcion">Descripción</Label>
        <Input
          id="descripcion"
          value={descripcion}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setDescripcion(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="precioMensual">Precio mensual (S/) *</Label>
        <Input
          id="precioMensual"
          type="number"
          min="0"
          step="0.01"
          value={precioMensual}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPrecioMensual(e.target.value)}
          required
        />
        {erroresCampo.precioMensual && (
          <p className="text-sm text-destructive">{erroresCampo.precioMensual}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/planes-soporte")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
