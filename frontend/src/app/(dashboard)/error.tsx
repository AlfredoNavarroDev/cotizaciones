"use client";

import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <h2 className="text-lg font-semibold text-foreground">Algo salió mal</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        {error.message ||
          "No se pudo cargar la información. Verificá que el backend esté corriendo en localhost:8080."}
      </p>
      <Button onClick={() => reset()}>Reintentar</Button>
    </div>
  );
}
