"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError } from "@/lib/api/client";
import type { Cliente } from "@/lib/api/clientes";
import type { RolTarifa } from "@/lib/api/tarifario";
import type { PlanSoporte } from "@/lib/api/planes-soporte";
import {
  crearCotizacion,
  actualizarCotizacion,
  type Cotizacion,
  type CotizacionInput,
  type EstadoCotizacion,
  type ItemCotizacionInput,
} from "@/lib/api/cotizaciones";

interface ItemFormState {
  nombreFase: string;
  descripcionTecnicaTexto: string;
  plazoSemanas: string;
  rolTarifaId: string;
  precioFinal: string;
}

const NINGUNO = "ninguno";

const ESTADOS: EstadoCotizacion[] = ["BORRADOR", "ENVIADA", "ACEPTADA", "RECHAZADA"];

function itemVacio(): ItemFormState {
  return { nombreFase: "", descripcionTecnicaTexto: "", plazoSemanas: "", rolTarifaId: NINGUNO, precioFinal: "" };
}

export function CotizacionForm({
  cotizacion,
  clientes,
  roles,
  planes,
}: {
  cotizacion?: Cotizacion;
  clientes: Cliente[];
  roles: RolTarifa[];
  planes: PlanSoporte[];
}) {
  const router = useRouter();
  const [clienteId, setClienteId] = useState(cotizacion ? String(cotizacion.cliente.id) : "");
  const [validezDias, setValidezDias] = useState(cotizacion ? String(cotizacion.validezDias) : "15");
  const [incluyeIGV, setIncluyeIGV] = useState(cotizacion?.incluyeIGV ?? false);
  const [estado, setEstado] = useState<EstadoCotizacion>(cotizacion?.estado ?? "BORRADOR");
  const [planSoporteId, setPlanSoporteId] = useState(
    cotizacion?.planSoporte ? String(cotizacion.planSoporte.id) : NINGUNO
  );
  const [tarifaSoporteFueraGarantia, setTarifaSoporteFueraGarantia] = useState(
    cotizacion?.tarifaSoporteFueraGarantia != null ? String(cotizacion.tarifaSoporteFueraGarantia) : ""
  );
  const [notasCostosNoIncluidos, setNotasCostosNoIncluidos] = useState(
    cotizacion?.notasCostosNoIncluidos ?? ""
  );
  const [items, setItems] = useState<ItemFormState[]>(
    cotizacion?.items.length
      ? cotizacion.items.map((item) => ({
          nombreFase: item.nombreFase,
          descripcionTecnicaTexto: item.descripcionTecnica.join("\n"),
          plazoSemanas: String(item.plazoSemanas),
          rolTarifaId: item.rolTarifaId ? String(item.rolTarifaId) : NINGUNO,
          precioFinal: String(item.precioFinal),
        }))
      : [itemVacio()]
  );
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [erroresCampo, setErroresCampo] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);

  function actualizarItem(index: number, campo: keyof ItemFormState, valor: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [campo]: valor } : item)));
  }

  function agregarItem() {
    setItems((prev) => [...prev, itemVacio()]);
  }

  function quitarItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    setErroresCampo({});

    const itemsPayload: ItemCotizacionInput[] = items.map((item) => ({
      nombreFase: item.nombreFase,
      descripcionTecnica: item.descripcionTecnicaTexto
        .split("\n")
        .map((linea) => linea.trim())
        .filter((linea) => linea.length > 0),
      plazoSemanas: Number(item.plazoSemanas),
      rolTarifaId: item.rolTarifaId === NINGUNO ? null : Number(item.rolTarifaId),
      precioFinal: Number(item.precioFinal),
    }));

    const data: CotizacionInput = {
      clienteId: Number(clienteId),
      validezDias: Number(validezDias),
      incluyeIGV,
      estado: cotizacion ? estado : null,
      planSoporteId: planSoporteId === NINGUNO ? null : Number(planSoporteId),
      tarifaSoporteFueraGarantia: tarifaSoporteFueraGarantia ? Number(tarifaSoporteFueraGarantia) : null,
      notasCostosNoIncluidos,
      items: itemsPayload,
    };

    try {
      if (cotizacion) {
        await actualizarCotizacion(cotizacion.id, data);
        router.push(`/cotizaciones/${cotizacion.id}`);
      } else {
        const creada = await crearCotizacion(data);
        router.push(`/cotizaciones/${creada.id}`);
      }
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setMensaje(err.message);
        setErroresCampo(err.errores ?? {});
      } else {
        setMensaje("No se pudo guardar la cotización.");
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6">
      {mensaje && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <p>{mensaje}</p>
          {Object.entries(erroresCampo).length > 0 && (
            <ul className="mt-1 list-disc pl-4">
              {Object.entries(erroresCampo).map(([campo, error]) => (
                <li key={campo}>
                  {campo}: {error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cliente">Cliente *</Label>
          <Select value={clienteId} onValueChange={(v) => setClienteId(v ?? "")}>
            <SelectTrigger id="cliente" className="w-full">
              <SelectValue placeholder="Selecciona un cliente" />
            </SelectTrigger>
            <SelectContent>
              {clientes.map((cliente) => (
                <SelectItem key={cliente.id} value={String(cliente.id)}>
                  {cliente.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="validezDias">Validez (días) *</Label>
          <Input
            id="validezDias"
            type="number"
            min="1"
            value={validezDias}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setValidezDias(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch id="incluyeIGV" checked={incluyeIGV} onCheckedChange={setIncluyeIGV} />
          <Label htmlFor="incluyeIGV">Incluye IGV (18%)</Label>
        </div>

        {cotizacion && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="estado">Estado</Label>
            <Select value={estado} onValueChange={(v) => setEstado(v as EstadoCotizacion)}>
              <SelectTrigger id="estado" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.map((e) => (
                  <SelectItem key={e} value={e}>
                    {e}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="planSoporte">Plan de soporte post-venta</Label>
          <Select value={planSoporteId} onValueChange={(v) => setPlanSoporteId(v ?? NINGUNO)}>
            <SelectTrigger id="planSoporte" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NINGUNO}>Ninguno</SelectItem>
              {planes.map((plan) => (
                <SelectItem key={plan.id} value={String(plan.id)}>
                  {plan.nombre}
                  {!plan.activo ? " (inactivo)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tarifaSoporte">Tarifa de soporte fuera de garantía (S/ por hora)</Label>
          <Input
            id="tarifaSoporte"
            type="number"
            min="0"
            step="0.01"
            value={tarifaSoporteFueraGarantia}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTarifaSoporteFueraGarantia(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notas">Notas de costos no incluidos</Label>
          <Textarea
            id="notas"
            value={notasCostosNoIncluidos}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNotasCostosNoIncluidos(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-foreground">Fases / módulos</h2>
        {items.map((item, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Fase {index + 1}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => quitarItem(index)}>
                Quitar
              </Button>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`item-${index}-nombre`}>Nombre de la fase *</Label>
              <Input
                id={`item-${index}-nombre`}
                value={item.nombreFase}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  actualizarItem(index, "nombreFase", e.target.value)
                }
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`item-${index}-descripcion`}>Descripción técnica (una línea por bullet)</Label>
              <Textarea
                id={`item-${index}-descripcion`}
                value={item.descripcionTecnicaTexto}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  actualizarItem(index, "descripcionTecnicaTexto", e.target.value)
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`item-${index}-plazo`}>Plazo (semanas) *</Label>
                <Input
                  id={`item-${index}-plazo`}
                  type="number"
                  min="1"
                  value={item.plazoSemanas}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    actualizarItem(index, "plazoSemanas", e.target.value)
                  }
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`item-${index}-precio`}>Precio final (S/) *</Label>
                <Input
                  id={`item-${index}-precio`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.precioFinal}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    actualizarItem(index, "precioFinal", e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`item-${index}-rol`}>Rol de tarifario (sugerencia de precio)</Label>
              <Select
                value={item.rolTarifaId}
                onValueChange={(v) => actualizarItem(index, "rolTarifaId", v ?? NINGUNO)}
              >
                <SelectTrigger id={`item-${index}-rol`} className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NINGUNO}>Ninguno</SelectItem>
                  {roles.map((rol) => (
                    <SelectItem key={rol.id} value={String(rol.id)}>
                      {rol.nombre}
                      {!rol.activo ? " (inactivo)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={agregarItem}>
          Agregar fase
        </Button>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(cotizacion ? `/cotizaciones/${cotizacion.id}` : "/cotizaciones")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
