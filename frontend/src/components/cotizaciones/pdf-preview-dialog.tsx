"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PdfPreviewDialog({
  cotizacionId,
  numero,
  variant,
  label,
}: {
  cotizacionId: number;
  numero: string;
  variant: "corta" | "detallada";
  label: string;
}) {
  const baseUrl = `/api/pdf/cotizaciones/${cotizacionId}/${variant}`;

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>{label}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {label} · {numero}
          </DialogTitle>
        </DialogHeader>
        <iframe
          src={`${baseUrl}?preview=1`}
          title={`${label} ${numero}`}
          className="h-[70vh] w-full rounded-md border border-border"
        />
        <DialogFooter>
          <Button nativeButton={false} render={<a href={baseUrl} />}>
            Descargar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
