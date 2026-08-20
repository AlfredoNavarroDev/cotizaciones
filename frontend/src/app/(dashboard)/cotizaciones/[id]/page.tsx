import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ApiError } from "@/lib/api/client";
import { obtenerCotizacion } from "@/lib/api/cotizaciones";
import { EstadoBadge } from "@/components/cotizaciones/estado-badge";
import { PagoForm } from "@/components/cotizaciones/pago-form";
import { EliminarPagoButton } from "@/components/cotizaciones/eliminar-pago-button";
import { EliminarCotizacionButton } from "@/components/cotizaciones/eliminar-cotizacion-button";
import { PdfPreviewDialog } from "@/components/cotizaciones/pdf-preview-dialog";

export default async function CotizacionDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let cotizacion;
  try {
    cotizacion = await obtenerCotizacion(Number(id));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{cotizacion.numero}</h1>
            <EstadoBadge estado={cotizacion.estado} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {cotizacion.cliente.nombre} · {cotizacion.fecha} · Validez {cotizacion.validezDias} días
          </p>
        </div>
        <div className="flex gap-2">
          <PdfPreviewDialog
            cotizacionId={cotizacion.id}
            numero={cotizacion.numero}
            variant="corta"
            label="PDF corto"
          />
          <PdfPreviewDialog
            cotizacionId={cotizacion.id}
            numero={cotizacion.numero}
            variant="detallada"
            label="PDF detallado"
          />
          <Button nativeButton={false} render={<Link href={`/cotizaciones/${cotizacion.id}/editar`} />}>
            Editar
          </Button>
          <EliminarCotizacionButton id={cotizacion.id} numero={cotizacion.numero} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">Fases / módulos</h2>
        {cotizacion.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin fases cargadas.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fase</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Plazo</TableHead>
                <TableHead>Precio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cotizacion.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nombreFase}</TableCell>
                  <TableCell>
                    {item.descripcionTecnica.length > 0 ? (
                      <ul className="list-disc pl-4">
                        {item.descripcionTecnica.map((bullet, i) => (
                          <li key={i}>{bullet}</li>
                        ))}
                      </ul>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{item.plazoSemanas} semanas</TableCell>
                  <TableCell>S/ {item.precioFinal.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex flex-col gap-1 rounded-lg border border-border p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>S/ {cotizacion.subtotal.toFixed(2)}</span>
        </div>
        {cotizacion.incluyeIGV && cotizacion.igv > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">IGV (18%)</span>
            <span>S/ {cotizacion.igv.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-foreground">
          <span>Total</span>
          <span>S/ {cotizacion.total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pagado</span>
          <span>S/ {cotizacion.montoPagado.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold text-foreground">
          <span>Saldo pendiente</span>
          <span>S/ {cotizacion.saldoPendiente.toFixed(2)}</span>
        </div>
      </div>

      {(cotizacion.planSoporte || cotizacion.tarifaSoporteFueraGarantia != null) && (
        <div className="flex flex-col gap-1 text-sm">
          <h2 className="text-lg font-semibold text-foreground">Soporte post-venta</h2>
          {cotizacion.planSoporte && <p>Plan: {cotizacion.planSoporte.nombre}</p>}
          {cotizacion.tarifaSoporteFueraGarantia != null && (
            <p>Tarifa fuera de garantía: S/ {cotizacion.tarifaSoporteFueraGarantia.toFixed(2)} / hora</p>
          )}
        </div>
      )}

      {cotizacion.notasCostosNoIncluidos && (
        <div className="flex flex-col gap-1 text-sm">
          <h2 className="text-lg font-semibold text-foreground">Costos no incluidos</h2>
          <p className="text-muted-foreground">{cotizacion.notasCostosNoIncluidos}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Pagos</h2>
        {cotizacion.pagos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay pagos registrados.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cotizacion.pagos.map((pago) => (
                <TableRow key={pago.id}>
                  <TableCell>{pago.fecha}</TableCell>
                  <TableCell>S/ {pago.monto.toFixed(2)}</TableCell>
                  <TableCell>{pago.metodo}</TableCell>
                  <TableCell>{pago.nota || "—"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <EliminarPagoButton id={pago.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <PagoForm cotizacionId={cotizacion.id} />
      </div>
    </div>
  );
}
