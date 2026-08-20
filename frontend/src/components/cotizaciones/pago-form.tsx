"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import { agregarPago, type MetodoPago } from "@/lib/api/cotizaciones";

const METODOS: MetodoPago[] = ["TRANSFERENCIA", "YAPE", "OTRO"];

export function PagoForm({ cotizacionId }: { cotizacionId: number }) {
  const router = useRouter();
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [metodo, setMetodo] = useState<MetodoPago>("TRANSFERENCIA");
  const [nota, setNota] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    try {
      await agregarPago(cotizacionId, { monto: Number(monto), fecha, metodo, nota });
      setMonto("");
      setNota("");
      router.refresh();
    } catch (err) {
      setMensaje(err instanceof ApiError ? err.message : "No se pudo registrar el pago.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4"
    >
      {mensaje && <p className="w-full text-sm text-destructive">{mensaje}</p>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pago-monto">Monto (S/) *</Label>
        <Input
          id="pago-monto"
          type="number"
          min="0"
          step="0.01"
          className="w-32"
          value={monto}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setMonto(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pago-fecha">Fecha *</Label>
        <Input
          id="pago-fecha"
          type="date"
          value={fecha}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setFecha(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pago-metodo">Método *</Label>
        <Select value={metodo} onValueChange={(v) => setMetodo(v as MetodoPago)}>
          <SelectTrigger id="pago-metodo" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METODOS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pago-nota">Nota</Label>
        <Input
          id="pago-nota"
          className="w-48"
          value={nota}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setNota(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={guardando}>
        {guardando ? "Guardando..." : "Agregar pago"}
      </Button>
    </form>
  );
}
