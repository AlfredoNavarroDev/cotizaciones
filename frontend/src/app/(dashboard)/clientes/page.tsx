import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listarClientes } from "@/lib/api/clientes";
import { EliminarClienteButton } from "@/components/clientes/eliminar-cliente-button";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = pageParam ? Number(pageParam) : 0;
  const data = await listarClientes(page);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Clientes</h1>
        <Button nativeButton={false} render={<Link href="/clientes/nuevo" />}>
          Nuevo cliente
        </Button>
      </div>

      {data.content.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay clientes.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>RUC / DNI</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.content.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell className="font-medium">{cliente.nombre}</TableCell>
                <TableCell>{cliente.empresa || "—"}</TableCell>
                <TableCell>{cliente.rucDni}</TableCell>
                <TableCell>{cliente.telefono || "—"}</TableCell>
                <TableCell>{cliente.email || "—"}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      nativeButton={false}
                      render={<Link href={`/clientes/${cliente.id}/editar`} />}
                    >
                      Editar
                    </Button>
                    <EliminarClienteButton id={cliente.id} nombre={cliente.nombre} />
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
                render={<Link href={`/clientes?page=${page - 1}`} />}
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
                render={<Link href={`/clientes?page=${page + 1}`} />}
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
