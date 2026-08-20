import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles } from "./styles";
import { formatearFecha, formatearMonto, GARANTIA_DIAS } from "./utils";
import type { Cotizacion } from "@/lib/api/cotizaciones";
import type { ConfiguracionEmisor } from "@/lib/api/configuracion-emisor";

export function CotizacionCortaDocument({
  cotizacion,
  emisor,
}: {
  cotizacion: Cotizacion;
  emisor: ConfiguracionEmisor;
}) {
  const semanasTotal = cotizacion.items.reduce((suma, item) => suma + item.plazoSemanas, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.content}>
        <View style={styles.letterhead}>
          <View>
            <Text style={styles.letterheadName}>{emisor.nombreRazonSocial || "—"}</Text>
            <Text style={styles.letterheadMeta}>Cotización estimada de proyecto de software</Text>
          </View>
          <View style={styles.letterheadRight}>
            <Text style={styles.docBadge}>Cotización</Text>
            <Text style={styles.docMeta}>
              N° <Text style={styles.docMetaValue}>{cotizacion.numero}</Text>
            </Text>
            <Text style={styles.docMeta}>
              Fecha <Text style={styles.docMetaValue}>{formatearFecha(cotizacion.fecha)}</Text>
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 9.5, marginBottom: 10 }}>
          Para: <Text style={{ fontFamily: "Helvetica-Bold" }}>{cotizacion.cliente.nombre}</Text>
          {cotizacion.cliente.empresa ? ` — ${cotizacion.cliente.empresa}` : ""}
        </Text>

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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>¿Qué incluye la solución?</Text>
        </View>
        {cotizacion.items.map((item) => (
          <View key={item.id} style={styles.checklistItem}>
            <Text style={styles.checklistCheck}>•</Text>
            <Text style={styles.checklistText}>{item.nombreFase}</Text>
          </View>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Inversión y tiempo estimado</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {semanasTotal} sem{semanasTotal === 1 ? "" : "."}
            </Text>
            <Text style={styles.statLabel}>Tiempo de entrega</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>S/ {formatearMonto(cotizacion.total)}</Text>
            <Text style={styles.statLabel}>
              Inversión total {cotizacion.incluyeIGV ? "· incl. IGV" : "· sin IGV"}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Forma de pago</Text>
        </View>
        <View style={styles.paymentStep}>
          <Text style={styles.paymentStepBadge}>1</Text>
          <Text style={styles.paymentStepText}>50% inicial para iniciar el desarrollo.</Text>
        </View>
        <View style={styles.paymentStep}>
          <Text style={styles.paymentStepBadge}>2</Text>
          <Text style={styles.paymentStepText}>
            50% a la entrega y conformidad del sistema funcionando.
          </Text>
        </View>

        {cotizacion.notasCostosNoIncluidos && (
          <Text style={{ marginTop: 12, fontSize: 8.5, color: "#64748b" }}>
            Nota: {cotizacion.notasCostosNoIncluidos}
          </Text>
        )}
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
