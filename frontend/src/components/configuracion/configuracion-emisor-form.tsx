"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import {
  actualizarConfiguracionEmisor,
  type ConfiguracionEmisor,
} from "@/lib/api/configuracion-emisor";

export function ConfiguracionEmisorForm({ configuracion }: { configuracion: ConfiguracionEmisor }) {
  const [nombreRazonSocial, setNombreRazonSocial] = useState(configuracion.nombreRazonSocial);
  const [rucDni, setRucDni] = useState(configuracion.rucDni);
  const [telefono, setTelefono] = useState(configuracion.telefono);
  const [email, setEmail] = useState(configuracion.email);
  const [direccion, setDireccion] = useState(configuracion.direccion ?? "");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [erroresCampo, setErroresCampo] = useState<Record<string, string>>({});
  const [guardado, setGuardado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    setErroresCampo({});
    setGuardado(false);

    try {
      await actualizarConfiguracionEmisor({ nombreRazonSocial, rucDni, telefono, email, direccion });
      setGuardado(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setMensaje(err.message);
        setErroresCampo(err.errores ?? {});
      } else {
        setMensaje("No se pudo guardar la configuración.");
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
      {guardado && (
        <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground">
          Guardado.
        </p>
      )}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nombreRazonSocial">Nombre / razón social *</Label>
        <Input
          id="nombreRazonSocial"
          value={nombreRazonSocial}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setNombreRazonSocial(e.target.value)}
          required
        />
        {erroresCampo.nombreRazonSocial && (
          <p className="text-sm text-destructive">{erroresCampo.nombreRazonSocial}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rucDni">RUC / DNI *</Label>
        <Input
          id="rucDni"
          value={rucDni}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setRucDni(e.target.value)}
          required
        />
        {erroresCampo.rucDni && <p className="text-sm text-destructive">{erroresCampo.rucDni}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="telefono">Teléfono *</Label>
        <Input
          id="telefono"
          value={telefono}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setTelefono(e.target.value)}
          required
        />
        {erroresCampo.telefono && <p className="text-sm text-destructive">{erroresCampo.telefono}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          required
        />
        {erroresCampo.email && <p className="text-sm text-destructive">{erroresCampo.email}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="direccion">Dirección</Label>
        <Input
          id="direccion"
          value={direccion}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setDireccion(e.target.value)}
        />
      </div>
      <div>
        <Button type="submit" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
