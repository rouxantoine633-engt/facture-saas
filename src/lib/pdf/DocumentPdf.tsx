import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PdfDocumentData } from "./build-data";
import { formatEurosForPdf, formatRate } from "./format";

// Accent de la charte de l'application (brand-700) ; le document reste lisible en noir et blanc.
const ACCENT = "#1e40af";
const ACCENT_LIGHT = "#eef2ff";

const styles = StyleSheet.create({
  page: { padding: 40, paddingBottom: 60, fontSize: 9, fontFamily: "Helvetica", color: "#111827" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: ACCENT,
  },
  sellerName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: ACCENT, maxWidth: 300 },
  headerRight: { alignItems: "flex-end" },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  number: { fontSize: 11, marginTop: 4, color: "#4b5563" },
  parties: { flexDirection: "row", gap: 24, marginBottom: 20 },
  party: { flex: 1, paddingTop: 10, paddingBottom: 10 },
  clientCard: { backgroundColor: "#f9fafb", paddingHorizontal: 10, borderRadius: 4 },
  partyTitle: {
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: ACCENT,
  },
  dates: { marginBottom: 16 },
  dateRow: { flexDirection: "row", marginBottom: 2 },
  dateLabel: { width: 110, color: "#4b5563" },
  table: { marginBottom: 12 },
  tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#d1d5db", paddingVertical: 4 },
  th: { fontFamily: "Helvetica-Bold", backgroundColor: ACCENT_LIGHT, color: "#1e3a8a" },
  cDesc: { flex: 4, paddingHorizontal: 3 },
  cQty: { flex: 1, textAlign: "right", paddingHorizontal: 3 },
  cPu: { flex: 1.6, textAlign: "right", paddingHorizontal: 3 },
  cVat: { flex: 1, textAlign: "right", paddingHorizontal: 3 },
  cTot: { flex: 1.6, textAlign: "right", paddingHorizontal: 3 },
  totalsBox: { alignSelf: "flex-end", width: 220, marginBottom: 16 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  grand: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    backgroundColor: ACCENT_LIGHT,
    borderTopWidth: 1,
    borderTopColor: ACCENT,
    paddingVertical: 5,
    paddingHorizontal: 4,
    marginTop: 3,
  },
  mentions: { marginTop: 8, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: "#d1d5db", color: "#374151" },
  mentionLine: { marginBottom: 2 },
  signature: { marginTop: 24, height: 70, borderWidth: 0.5, borderColor: "#9ca3af", padding: 6, width: 220 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: "#6b7280" },
  watermark: { position: "absolute", top: 320, left: 90, fontSize: 90, color: "#e5e7eb", transform: "rotate(-30deg)", fontFamily: "Helvetica-Bold" },
});

export function DocumentPdf({ data }: { data: PdfDocumentData }) {
  return (
    <Document title={`${data.title} ${data.numberLabel}`} language="fr-FR">
      <Page size="A4" style={styles.page}>
        {data.isDraft && <Text style={styles.watermark} fixed>BROUILLON</Text>}

        <View style={styles.header}>
          <Text style={styles.sellerName}>{data.sellerName}</Text>
          <View style={styles.headerRight}>
            <Text style={styles.title}>{data.title}</Text>
            <Text style={styles.number}>{data.numberLabel}</Text>
          </View>
        </View>

        <View style={styles.parties}>
          <View style={styles.party}>
            <Text style={styles.partyTitle}>Émetteur</Text>
            {data.sellerLines.map((l, i) => (
              <Text key={i}>{l}</Text>
            ))}
          </View>
          <View style={[styles.party, styles.clientCard]}>
            <Text style={styles.partyTitle}>Client</Text>
            {data.buyerLines.map((l, i) => (
              <Text key={i}>{l}</Text>
            ))}
          </View>
        </View>

        <View style={styles.dates}>
          {data.dates.map((d) => (
            <View key={d.label} style={styles.dateRow}>
              <Text style={styles.dateLabel}>{d.label}</Text>
              <Text>{d.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.table}>
          <View style={[styles.tr, styles.th]} fixed>
            <Text style={styles.cDesc}>Désignation</Text>
            <Text style={styles.cQty}>Qté</Text>
            <Text style={styles.cPu}>PU HT</Text>
            {!data.franchise && <Text style={styles.cVat}>TVA</Text>}
            <Text style={styles.cTot}>Total HT</Text>
          </View>
          {data.lines.map((l, i) => (
            <View key={i} style={styles.tr} wrap={false}>
              <Text style={styles.cDesc}>{l.description}</Text>
              <Text style={styles.cQty}>{l.quantity}</Text>
              <Text style={styles.cPu}>{formatEurosForPdf(l.unitPriceCents)}</Text>
              {!data.franchise && <Text style={styles.cVat}>{formatRate(l.vatRatePer100000)}</Text>}
              <Text style={styles.cTot}>{formatEurosForPdf(l.lineHtCents)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBox} wrap={false}>
          <View style={styles.totalRow}>
            <Text>Total HT</Text>
            <Text>{formatEurosForPdf(data.totals.subtotalHtCents)}</Text>
          </View>
          {data.franchise ? (
            <View style={styles.totalRow}>
              <Text>{data.vatMention}</Text>
            </View>
          ) : (
            <>
              {data.totals.vatBreakdown.map((b) => (
                <View key={b.vatRatePer100000} style={styles.totalRow}>
                  <Text>
                    TVA {formatRate(b.vatRatePer100000)} (base {formatEurosForPdf(b.baseHtCents)})
                  </Text>
                  <Text>{formatEurosForPdf(b.vatCents)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text>Total TVA</Text>
                <Text>{formatEurosForPdf(data.totals.totalVatCents)}</Text>
              </View>
            </>
          )}
          <View style={[styles.totalRow, styles.grand]}>
            <Text>{data.totalLabel}</Text>
            <Text>{formatEurosForPdf(data.totals.totalTtcCents)}</Text>
          </View>
        </View>

        <View style={styles.mentions} wrap={false}>
          {data.mentions.map((m, i) => (
            <Text key={i} style={styles.mentionLine}>
              {m}
            </Text>
          ))}
          {data.bankLines.map((m, i) => (
            <Text key={`b${i}`} style={styles.mentionLine}>
              {m}
            </Text>
          ))}
        </View>

        {data.kind === "QUOTE" && (
          <View style={styles.signature} wrap={false}>
            <Text>Bon pour accord — date et signature du client :</Text>
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text>{data.footerLine}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
