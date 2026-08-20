"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { crearCliente, actualizarCliente, type Cliente, type ClienteInput } from "@/lib/api/clientes";

export function ClienteForm({ cliente }: { cliente?: Cliente }) {
  const router = useRouter();
  const [values, setValues] = useState<ClienteInput>({
    nombre: cliente?.nombre ?? "",
    empresa: cliente?.empresa ?? "",
    rucDni: cliente?.rucDni ?? "",
    telefono: cliente?.telefono ?? "",
    email: cliente?.email ?? "",
  });
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [erroresCampo, setErroresCampo] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);

  function set(field: keyof ClienteInput) {
    return (e: ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    setErroresCampo({});
    try {
      if (cliente) {
        await actualizarCliente(cliente.id, values);
      } else {
        await crearCliente(values);
      }
      router.push("/clientes");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setMensaje(err.message);
        setErroresCampo(err.errores ?? {});
      } else {
        setMensaje("No se pudo guardar el cliente.");
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
        <Input id="nombre" value={values.nombre} onChange={set("nombre")} required />
        {erroresCampo.nombre && (
          <p className="text-sm text-destructive">{erroresCampo.nombre}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="empresa">Empresa</Label>
        <Input id="empresa" value={values.empresa} onChange={set("empresa")} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rucDni">RUC / DNI *</Label>
        <Input id="rucDni" value={values.rucDni} onChange={set("rucDni")} required />
        {erroresCampo.rucDni && (
          <p className="text-sm text-destructive">{erroresCampo.rucDni}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input id="telefono" value={values.telefono} onChange={set("telefono")} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={values.email} onChange={set("email")} />
        {erroresCampo.email && (
          <p className="text-sm text-destructive">{erroresCampo.email}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/clientes")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
