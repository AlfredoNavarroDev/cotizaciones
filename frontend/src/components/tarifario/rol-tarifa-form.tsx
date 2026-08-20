"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { crearRol, actualizarRol, type RolTarifa, type RolTarifaInput } from "@/lib/api/tarifario";

export function RolTarifaForm({ rol }: { rol?: RolTarifa }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(rol?.nombre ?? "");
  const [tarifaMinima, setTarifaMinima] = useState(rol ? String(rol.tarifaMinima) : "");
  const [tarifaMaxima, setTarifaMaxima] = useState(rol ? String(rol.tarifaMaxima) : "");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [erroresCampo, setErroresCampo] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    setErroresCampo({});

    const data: RolTarifaInput = {
      nombre,
      tarifaMinima: Number(tarifaMinima),
      tarifaMaxima: Number(tarifaMaxima),
      activo: rol?.activo ?? true,
    };

    try {
      if (rol) {
        await actualizarRol(rol.id, data);
      } else {
        await crearRol(data);
      }
      router.push("/tarifario");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setMensaje(err.message);
        setErroresCampo(err.errores ?? {});
      } else {
        setMensaje("No se pudo guardar el rol.");
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
        <Label htmlFor="tarifaMinima">Tarifa mínima (S/ por hora) *</Label>
        <Input
          id="tarifaMinima"
          type="number"
          min="0"
          step="0.01"
          value={tarifaMinima}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTarifaMinima(e.target.value)}
          required
        />
        {erroresCampo.tarifaMinima && (
          <p className="text-sm text-destructive">{erroresCampo.tarifaMinima}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tarifaMaxima">Tarifa máxima (S/ por hora) *</Label>
        <Input
          id="tarifaMaxima"
          type="number"
          min="0"
          step="0.01"
          value={tarifaMaxima}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTarifaMaxima(e.target.value)}
          required
        />
        {erroresCampo.tarifaMaxima && (
          <p className="text-sm text-destructive">{erroresCampo.tarifaMaxima}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/tarifario")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
