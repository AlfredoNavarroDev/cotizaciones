import { StyleSheet } from "@react-pdf/renderer";

// Paleta de marca pedida por el usuario — un solo acento, ver ui-ux-pro-max §4
// style-selection (no mezclar acentos).
export const COLORS = {
  ink: "#0f172a", // Azul Noche — fondos de encabezado, texto principal
  body: "#334155",
  muted: "#64748b", // Gris Pizarra — texto secundario, bordes/separadores visibles
  faint: "#94a3b8",
  onNavy: "#cbd5e1", // texto secundario legible sobre fondo Azul Noche
  accent: "#06b6d4", // Cian Eléctrico — botones, íconos, enlaces, cifras clave
  accentSoft: "#ecfeff",
  border: "#e2e8f0", // hairlines de tabla: más claro que Gris Pizarra a propósito (gridline-subtle)
  borderStrong: "#64748b",
  surface: "#f8fafc", // Blanco Nieve — fondo del área de contenido
  white: "#ffffff",
};

export const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 56,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: COLORS.body,
  },
  // lineHeight va acá y NO en `page`: un Text con `render` prop (page numbers) en
  // cualquier subárbol que herede lineHeight del Page pierde su contenido — bug de
  // react-pdf 4.6 en resolveDynamicNodes/relayout. El footer queda fuera de este
  // wrapper, como hermano directo de Page, para no heredarlo.
  content: { lineHeight: 1.45 },

  // Membrete: banda Azul Noche — primera impresión "seria y sólida" para un cliente
  // dudoso, con el acento Cian reservado para el badge y las cifras. Sin márgenes
  // negativos: un margen negativo en este nodo corrompe el cálculo de alto/ancho de
  // los Text-badge (círculos numerados) más abajo en la página — bug de layout de
  // react-pdf 4.6 que no vale la pena perseguir por un bleed de borde a borde.
  letterhead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: COLORS.ink,
    borderRadius: 4,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.accent,
  },
  letterheadName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: COLORS.white, letterSpacing: 0.2 },
  letterheadMeta: { fontSize: 8.5, color: COLORS.onNavy, marginTop: 3 },
  letterheadRight: { alignItems: "flex-end" },
  // lineHeight:1 es obligatorio en todo Text-badge (padding+borderRadius+bg) que
  // viva dentro de `content` (lineHeight:1.45): heredarlo infla el alto del Text
  // muy por encima del real y la "píldora" sale estirada en vez de circular/compacta
  // — otro bug de layout de react-pdf 4.6, confirmado aislado fuera de este archivo.
  docBadge: {
    backgroundColor: COLORS.accent,
    color: COLORS.ink,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 3,
    lineHeight: 1,
  },
  docMeta: { fontSize: 8.5, color: COLORS.onNavy, marginTop: 6, textAlign: "right" },
  docMetaValue: { color: COLORS.white, fontFamily: "Helvetica-Bold" },

  // Franja de confianza bajo el membrete — refuerza garantía/pago/soporte de un
  // vistazo, pensada para un cliente dudoso que decide antes de leer el detalle.
  trustStrip: { flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  // "✓" (U+2713) no existe en WinAnsi (fuentes base14 de PDF) y se descarta en
  // silencio — "•" sí está soportado.
  trustBadgeMark: { fontSize: 9, fontFamily: "Helvetica-Bold", color: COLORS.accent },
  trustBadgeText: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: COLORS.ink },

  // Encabezados de sección numerados/con acento.
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 18,
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderStrong,
  },
  // Nota: un View con tamaño fijo centrando un Text de un solo carácter colapsa a
  // tamaño 0 en el layout de react-pdf 4.6 (bug de Yoga con nodos de texto diminutos).
  // El badge tiene que ser el Text mismo (círculo vía padding), no un View envolviéndolo.
  sectionBadge: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 8,
    textAlign: "center",
    lineHeight: 1,
    minWidth: 16,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  bullet: { flexDirection: "row", marginBottom: 3, gap: 5 },
  bulletDot: { width: 8, color: COLORS.accent, fontFamily: "Helvetica-Bold" },

  // Tarjeta DE / PARA de la propuesta detallada.
  infoCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 12,
    gap: 16,
  },
  infoCol: { flex: 1 },
  infoLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoName: { fontSize: 10, fontFamily: "Helvetica-Bold", color: COLORS.ink, marginBottom: 2 },
  infoLine: { fontSize: 8.5, color: COLORS.body, marginBottom: 1 },

  // Tabla de costos.
  tableWrap: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 4,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: COLORS.ink,
    paddingVertical: 6,
    paddingHorizontal: 9,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  tableRowAlt: { backgroundColor: COLORS.surface },
  colFase: { flex: 3, color: COLORS.ink },
  colPlazo: { flex: 1, textAlign: "right", color: COLORS.muted },
  colPrecio: { flex: 1.2, textAlign: "right", fontFamily: "Helvetica-Bold", color: COLORS.ink },

  // Caja de totales.
  totalsCard: {
    marginTop: 12,
    alignSelf: "flex-end",
    width: 240,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    padding: 10,
    backgroundColor: COLORS.surface,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalLabel: { fontSize: 9, color: COLORS.muted },
  totalValue: { fontSize: 9, color: COLORS.ink },
  totalRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.accent,
  },
  totalFinalLabel: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  totalFinalValue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: COLORS.accent },

  // Nota: un View "fixed" en flexDirection row + justifyContent space-between con
  // position absolute pierde el texto de sus hijos en react-pdf 4.6 (mismo bug de
  // layout que los badges) — cada elemento del footer va fixed por separado.
  footerRule: {
    position: "absolute",
    bottom: 38,
    left: 40,
    right: 40,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  footerLeft: { position: "absolute", bottom: 26, left: 40, fontSize: 7.5, color: COLORS.muted },
  // "right" sin "left"/"width" explícito no se mide bien (mismo bug de tamaño 0) —
  // se ancla con "right" pero se le da un width fijo y se alinea el texto a la derecha.
  footerRight: {
    position: "absolute",
    bottom: 26,
    right: 40,
    width: 140,
    fontSize: 7.5,
    color: COLORS.muted,
    textAlign: "right",
  },

  // Tarjetas KPI (usadas en la cotización corta).
  statsRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 4,
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    alignItems: "center",
  },
  statValue: { fontSize: 17, fontFamily: "Helvetica-Bold", color: COLORS.accent },
  statLabel: {
    fontSize: 7.5,
    color: COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginTop: 4,
    textAlign: "center",
  },

  checklistItem: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  // "✓" (U+2713) no existe en la codificación WinAnsi de las fuentes base14 de PDF y
  // se descarta en silencio — usar "•", que sí está soportado (igual que bulletDot).
  checklistCheck: { fontSize: 10, fontFamily: "Helvetica-Bold", color: COLORS.accent, width: 10 },
  checklistText: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: COLORS.ink },

  paymentStep: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  paymentStepBadge: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 8,
    textAlign: "center",
    lineHeight: 1,
    minWidth: 16,
  },
  paymentStepText: { fontSize: 9, color: COLORS.body },

  signature: { marginTop: 36, alignItems: "center" },
  signatureLine: { borderTopWidth: 1, borderTopColor: COLORS.borderStrong, width: 200, marginBottom: 4 },
  signatureName: { fontSize: 9, fontFamily: "Helvetica-Bold", color: COLORS.ink },
  signatureRole: { fontSize: 8, color: COLORS.muted, fontFamily: "Helvetica-Oblique", marginTop: 1 },
});
