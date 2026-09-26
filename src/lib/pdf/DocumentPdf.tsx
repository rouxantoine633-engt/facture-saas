import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PdfDocumentData } from "./build-data";
import { formatEurosForPdf, formatRate } from "./format";

const styles = StyleSheet.create({
  page: { padding: 40, paddingBottom: 60, fontSize: 9, fontFamily: "Helvetica", color: "#111827" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold" },
  number: { fontSize: 12, marginTop: 4 },
  parties: { flexDirection: "row", gap: 24, marginBottom: 20 },
  party: { flex: 1 },
  partyTitle: { fontFamily: "Helvetica-Bold", marginBottom: 4, fontSize: 10 },
  dates: { marginBottom: 16 },
  dateRow: { flexDirection: "row", marginBottom: 2 },
  dateLabel: { width: 110, color: "#4b5563" },
  table: { marginBottom: 12 },
  tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#d1d5db", paddingVertical: 4 },
  th: { fontFamily: "Helvetica-Bold", backgroundColor: "#f3f4f6" },
  cDesc: { flex: 4, paddingHorizontal: 3 },
  cQty: { flex: 1, textAlign: "right", paddingHorizontal: 3 },
  cPu: { flex: 1.6, textAlign: "right", paddingHorizontal: 3 },
  cVat: { flex: 1, textAlign: "right", paddingHorizontal: 3 },
  cTot: { flex: 1.6, textAlign: "right", paddingHorizontal: 3 },
  totalsBox: { alignSelf: "flex-end", width: 220, marginBottom: 16 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  grand: { fontFamily: "Helvetica-Bold", fontSize: 11, borderTopWidth: 1, borderTopColor: "#111827", paddingTop: 4, marginTop: 2 },
  mentions: { marginTop: 8, color: "#374151" },
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
          <View>
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
          <View style={styles.party}>
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
            <Text>Total TTC</Text>
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
