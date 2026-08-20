import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { obtenerCliente } from "@/lib/api/clientes";
import { ClienteForm } from "@/components/clientes/cliente-form";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let cliente;
  try {
    cliente = await obtenerCliente(Number(id));
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-foreground">Editar cliente</h1>
      <ClienteForm cliente={cliente} />
    </div>
  );
}
