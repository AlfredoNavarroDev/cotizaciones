import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listarTarifario } from "@/lib/api/tarifario";
import { ToggleActivoButton } from "@/components/tarifario/toggle-activo-button";

// Sin searchParams/params que fuercen render dinámico automáticamente (a diferencia
// de /clientes) — sin esto Next prerenderiza la lista como estática en el build y
// congela los roles de esa fecha.
export const dynamic = "force-dynamic";

export default async function TarifarioPage() {
  const roles = await listarTarifario();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Tarifario</h1>
        <Button nativeButton={false} render={<Link href="/tarifario/nuevo" />}>
          Nuevo rol
        </Button>
      </div>

      {roles.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay roles en el tarifario.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tarifa mínima</TableHead>
              <TableHead>Tarifa máxima</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((rol) => (
              <TableRow key={rol.id}>
                <TableCell className="font-medium">{rol.nombre}</TableCell>
                <TableCell>S/ {rol.tarifaMinima.toFixed(2)}</TableCell>
                <TableCell>S/ {rol.tarifaMaxima.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={rol.activo ? "default" : "secondary"}>
                    {rol.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/tarifario/${rol.id}/editar`} />}
                    >
                      Editar
                    </Button>
                    <ToggleActivoButton rol={rol} />
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
