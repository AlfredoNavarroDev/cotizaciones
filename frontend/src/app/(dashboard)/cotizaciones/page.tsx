import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listarCotizaciones } from "@/lib/api/cotizaciones";
import { EstadoBadge } from "@/components/cotizaciones/estado-badge";

export default async function CotizacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = pageParam ? Number(pageParam) : 0;
  const data = await listarCotizaciones(page);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Cotizaciones</h1>
        <Button nativeButton={false} render={<Link href="/cotizaciones/nuevo" />}>
          Nueva cotización
        </Button>
      </div>

      {data.content.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay cotizaciones.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.content.map((cotizacion) => (
              <TableRow key={cotizacion.id}>
                <TableCell className="font-medium">{cotizacion.numero}</TableCell>
                <TableCell>{cotizacion.cliente.nombre}</TableCell>
                <TableCell>{cotizacion.fecha}</TableCell>
                <TableCell>
                  <EstadoBadge estado={cotizacion.estado} />
                </TableCell>
                <TableCell>S/ {cotizacion.total.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/cotizaciones/${cotizacion.id}`} />}
                    >
                      Ver
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {data.number + 1} de {data.totalPages}
          </span>
          <div className="flex gap-2">
            {data.first ? (
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={`/cotizaciones?page=${page - 1}`} />}
              >
                Anterior
              </Button>
            )}
            {data.last ? (
              <Button variant="outline" size="sm" disabled>
                Siguiente
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                render={<Link href={`/cotizaciones?page=${page + 1}`} />}
              >
                Siguiente
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
