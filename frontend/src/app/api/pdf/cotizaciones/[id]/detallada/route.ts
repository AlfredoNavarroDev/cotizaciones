import { createElement } from "react";
import type { ReactElement } from "react";
import { NextResponse } from "next/server";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { obtenerCotizacion } from "@/lib/api/cotizaciones";
import { obtenerConfiguracionEmisor } from "@/lib/api/configuracion-emisor";
import { CotizacionDetalladaDocument } from "@/lib/pdf/CotizacionDetalladaDocument";

// route.ts (no .tsx): sin JSX acá para no depender de si Next.js reconoce route.tsx
// como convención de archivo — createElement evita la duda.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const preview = new URL(request.url).searchParams.get("preview") === "1";
  const [cotizacion, emisor] = await Promise.all([
    obtenerCotizacion(Number(id)),
    obtenerConfiguracionEmisor(),
  ]);

  const buffer = await renderToBuffer(
    createElement(CotizacionDetalladaDocument, { cotizacion, emisor }) as ReactElement<DocumentProps>
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${preview ? "inline" : "attachment"}; filename="${cotizacion.numero}-detallada.pdf"`,
    },
  });
}
