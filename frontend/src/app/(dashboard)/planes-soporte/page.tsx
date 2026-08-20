import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listarPlanesSoporte } from "@/lib/api/planes-soporte";
import { ToggleActivoButton } from "@/components/planes-soporte/toggle-activo-button";

// Sin searchParams/params que fuercen render dinámico automáticamente — sin esto Next
// prerenderiza la lista como estática en el build y congela los planes de esa fecha
// (mismo bug encontrado en /tarifario).
export const dynamic = "force-dynamic";

export default async function PlanesSoportePage() {
  const planes = await listarPlanesSoporte();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Planes de Soporte</h1>
        <Button nativeButton={false} render={<Link href="/planes-soporte/nuevo" />}>
          Nuevo plan
        </Button>
      </div>

      {planes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay planes de soporte.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Precio mensual</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {planes.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.nombre}</TableCell>
                <TableCell>{plan.descripcion || "—"}</TableCell>
                <TableCell>S/ {plan.precioMensual.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={plan.activo ? "default" : "secondary"}>
                    {plan.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/planes-soporte/${plan.id}/editar`} />}
                    >
                      Editar
                    </Button>
                    <ToggleActivoButton plan={plan} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
