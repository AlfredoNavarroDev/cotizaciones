import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles, COLORS } from "./styles";
import { formatearFecha, formatearMonto, letra, GARANTIA_DIAS } from "./utils";
import type { Cotizacion } from "@/lib/api/cotizaciones";
import type { ConfiguracionEmisor } from "@/lib/api/configuracion-emisor";

function SectionHeader({ n, label }: { n: number; label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionBadge}>{n}</Text>
      <Text style={styles.sectionLabel}>{label}</Text>
    </View>
  );
}

export function CotizacionDetalladaDocument({
  cotizacion,
  emisor,
}: {
  cotizacion: Cotizacion;
  emisor: ConfiguracionEmisor;
}) {
  const adelanto = cotizacion.total / 2;
  const saldoFinal = cotizacion.total - adelanto;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.content}>
        <View style={styles.letterhead}>
          <View>
            <Text style={styles.letterheadName}>{emisor.nombreRazonSocial || "—"}</Text>
            <Text style={styles.letterheadMeta}>Propuesta técnica y económica</Text>
          </View>
          <View style={styles.letterheadRight}>
            <Text style={styles.docBadge}>Propuesta</Text>
            <Text style={styles.docMeta}>
              N° <Text style={styles.docMetaValue}>{cotizacion.numero}</Text>
            </Text>
            <Text style={styles.docMeta}>
              Fecha <Text style={styles.docMetaValue}>{formatearFecha(cotizacion.fecha)}</Text>
            </Text>
            <Text style={styles.docMeta}>
              Validez <Text style={styles.docMetaValue}>{cotizacion.validezDias} días</Text>
            </Text>
          </View>
        </View>

        <View style={styles.trustStrip}>
          <View style={styles.trustBadge}>
            <Text style={styles.trustBadgeMark}>•</Text>
            <Text style={styles.trustBadgeText}>Garantía {GARANTIA_DIAS} días</Text>
          </View>
          <View style={styles.trustBadge}>
            <Text style={styles.trustBadgeMark}>•</Text>
            <Text style={styles.trustBadgeText}>Pago seguro · transferencia o Yape</Text>
          </View>
          {cotizacion.planSoporte && (
            <View style={styles.trustBadge}>
              <Text style={styles.trustBadgeMark}>•</Text>
              <Text style={styles.trustBadgeText}>Soporte post-venta incluido</Text>
            </View>
          )}
        </View>

        <SectionHeader n={1} label="Información del proveedor y cliente" />
        <View style={styles.infoCard}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>De</Text>
            <Text style={styles.infoName}>{emisor.nombreRazonSocial || "—"}</Text>
            <Text style={styles.infoLine}>RUC/DNI: {emisor.rucDni}</Text>
            <Text style={styles.infoLine}>
              {emisor.telefono} · {emisor.email}
            </Text>
            {emisor.direccion && <Text style={styles.infoLine}>{emisor.direccion}</Text>}
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Para</Text>
            <Text style={styles.infoName}>
              {cotizacion.cliente.nombre}
              {cotizacion.cliente.empresa ? ` (${cotizacion.cliente.empresa})` : ""}
            </Text>
            <Text style={styles.infoLine}>RUC/DNI: {cotizacion.cliente.rucDni}</Text>
          </View>
        </View>

        <SectionHeader n={2} label="Alcance técnico y entregables" />
        {cotizacion.items.map((item, i) => (
          <View key={item.id} style={{ marginBottom: 8 }}>
            <Text style={{ fontFamily: "Helvetica-Bold", color: COLORS.ink, marginBottom: 3 }}>
              {letra(i)}) {item.nombreFase}
            </Text>
            {item.descripcionTecnica.map((bullet, j) => (
              <View key={j} style={[styles.bullet, { marginLeft: 12 }]}>
                <Text style={styles.bulletDot}>•</Text>
                <Text>{bullet}</Text>
              </View>
            ))}
          </View>
        ))}

        <SectionHeader n={3} label="Estructura de costos y tiempos" />
        <View style={styles.tableWrap}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.colFase, { color: COLORS.white }]}>Fase</Text>
            <Text style={[styles.tableHeaderCell, styles.colPlazo, { color: COLORS.white }]}>Plazo</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrecio, { color: COLORS.white }]}>Subtotal</Text>
          </View>
          {cotizacion.items.map((item, i) => (
            <View
              key={item.id}
              style={[styles.tableRow, ...(i % 2 === 1 ? [styles.tableRowAlt] : [])]}
            >
              <Text style={styles.colFase}>{item.nombreFase}</Text>
              <Text style={styles.colPlazo}>{item.plazoSemanas} sem</Text>
              <Text style={styles.colPrecio}>S/ {formatearMonto(item.precioFinal)}</Text>
            </View>
          ))}
        </View>
        <View style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>S/ {formatearMonto(cotizacion.subtotal)}</Text>
          </View>
          {cotizacion.incluyeIGV && cotizacion.igv > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IGV (18%)</Text>
              <Text style={styles.totalValue}>S/ {formatearMonto(cotizacion.igv)}</Text>
            </View>
          )}
          <View style={styles.totalRowFinal}>
            <Text style={styles.totalFinalLabel}>Total a cancelar</Text>
            <Text style={styles.totalFinalValue}>S/ {formatearMonto(cotizacion.total)}</Text>
          </View>
        </View>

        <SectionHeader n={4} label="Garantía y soporte post-venta" />
        <Text>
          Garantía de fábrica: {GARANTIA_DIAS} días calendario tras la entrega. Cubre corrección
          de fallos/errores del código sin costo extra.
        </Text>
        {cotizacion.tarifaSoporteFueraGarantia != null && (
          <Text style={{ marginTop: 4 }}>
            Soporte fuera de garantía: S/ {formatearMonto(cotizacion.tarifaSoporteFueraGarantia)} /
            hora.
          </Text>
        )}
        {cotizacion.planSoporte && (
          <Text style={{ marginTop: 4 }}>
            Plan de mantenimiento mensual: {cotizacion.planSoporte.nombre} — S/{" "}
            {formatearMonto(cotizacion.planSoporte.precioMensual)} / mes.
          </Text>
        )}

        <SectionHeader n={5} label="Condiciones de pago y aceptación" />
        <View style={[styles.bullet, { marginBottom: 4 }]}>
          <Text style={styles.bulletDot}>•</Text>
          <Text>50% de adelanto (S/ {formatearMonto(adelanto)}) a la aceptación de esta propuesta.</Text>
        </View>
        <View style={[styles.bullet, { marginBottom: 4 }]}>
          <Text style={styles.bulletDot}>•</Text>
          <Text>
            50% saldo final (S/ {formatearMonto(saldoFinal)}) tras pruebas de conformidad y entrega.
          </Text>
        </View>
        <View style={styles.bullet}>
          <Text style={styles.bulletDot}>•</Text>
          <Text>Pagos mediante transferencia bancaria o Yape.</Text>
        </View>

        {cotizacion.notasCostosNoIncluidos && (
          <>
            <SectionHeader n={6} label="Costos no incluidos" />
            <Text>{cotizacion.notasCostosNoIncluidos}</Text>
          </>
        )}

        <View style={styles.signature}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName}>{emisor.nombreRazonSocial || "—"}</Text>
          <Text style={styles.signatureRole}>Proveedor</Text>
        </View>
        </View>

        <View style={styles.footerRule} fixed />
        <Text style={styles.footerLeft} fixed>
          {emisor.nombreRazonSocial} · {emisor.telefono} · {emisor.email}
        </Text>
        <Text
          style={styles.footerRight}
          fixed
          render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
        />
      </Page>
    </Document>
  );
}
