import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PaymentsReport, SalesReport } from "@/lib/export/report";
import { formatDate } from "@/lib/labels";
import { accentForText, mix, readableTextOn, tint } from "./colors";
import { PDF_FONT, PDF_FONT_BOLD, registerPdfFonts } from "./fonts";
import { formatEurosForPdf, formatRate } from "./format";
import { fitLogo, REPORT_LOGO_BOX, type PdfLogo } from "./logo";
import { PAGE_BOTTOM_PADDING, PdfFooter } from "./PdfFooter";

registerPdfFonts();

interface ReportBase {
  company: {
    legalName: string;
    /** Couleur principale « #rrggbb », déjà validée. */
    brandColor: string;
    logo?: PdfLogo;
    /** Mentions légales de l'émetteur (identique au pied de page des factures). */
    footerLines: string[];
  };
  period: { from: Date; to: Date };
  generatedAt: Date;
}

export type ExportReportInput =
  | (ReportBase & { kind: "SALES"; report: SalesReport })
  | (ReportBase & { kind: "PAYMENTS"; report: PaymentsReport });

export const REPORT_TITLES = { SALES: "Journal des ventes", PAYMENTS: "Encaissements" } as const;

/** Libellé de la période, ex. « du 01/11/2026 au 30/11/2026 ». */
export const periodLabel = (p: { from: Date; to: Date }) => `du ${formatDate(p.from)} au ${formatDate(p.to)}`;

function makeStyles(brand: string) {
  const accentText = accentForText(brand);
  return StyleSheet.create({
    page: { padding: 40, paddingBottom: PAGE_BOTTOM_PADDING, fontSize: 8.5, fontFamily: PDF_FONT, color: "#111827" },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingBottom: 12,
      borderBottomWidth: 2,
      borderBottomColor: brand,
    },
    brand: { flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 12 },
    logo: { marginRight: 10 },
    company: { fontSize: 14, fontFamily: PDF_FONT_BOLD, color: accentText, flex: 1 },
    titleBox: { alignItems: "flex-end" },
    title: { fontSize: 17, fontFamily: PDF_FONT_BOLD, color: "#111827" },
    period: { marginTop: 3, fontSize: 9.5, color: "#374151" },
    meta: { marginTop: 8, marginBottom: 14, color: "#4b5563" },
    kpis: { flexDirection: "row", marginBottom: 16, gap: 8 },
    kpi: { flex: 1, backgroundColor: tint(brand, 0.92), borderLeftWidth: 3, borderLeftColor: brand, paddingVertical: 7, paddingHorizontal: 9 },
    kpiLabel: { fontSize: 7.5, color: "#374151", marginBottom: 3 },
    kpiValue: { fontSize: 12.5, fontFamily: PDF_FONT_BOLD, color: "#111827" },
    kpiNote: { fontSize: 7.5, color: "#4b5563", marginTop: 2 },
    sectionTitle: { fontSize: 10, fontFamily: PDF_FONT_BOLD, color: accentText, marginTop: 6, marginBottom: 5 },
    th: { flexDirection: "row", backgroundColor: brand, color: readableTextOn(brand), fontFamily: PDF_FONT_BOLD, paddingVertical: 4 },
    tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#d1d5db", paddingVertical: 3.5 },
    trAlt: { backgroundColor: "#f9fafb" },
    trTotal: {
      flexDirection: "row",
      backgroundColor: tint(brand, 0.9),
      borderTopWidth: 1,
      borderTopColor: brand,
      fontFamily: PDF_FONT_BOLD,
      paddingVertical: 4.5,
    },
    cell: { paddingHorizontal: 4 },
    right: { textAlign: "right" },
    empty: { color: "#4b5563", marginVertical: 8 },
    note: { marginTop: 10, color: mix("#111827", "#ffffff", 0.35), fontSize: 7.5 },
  });
}
type Styles = ReturnType<typeof makeStyles>;

interface Column {
  label: string;
  width?: number;
  flex?: number;
  align?: "right";
}

function cellStyle(styles: Styles, c: Column) {
  return [styles.cell, c.align === "right" ? styles.right : {}, c.width ? { width: c.width } : { flex: c.flex ?? 1 }];
}

/** Tableau : en-tête coloré, lignes alternées, ligne de total facultative. `repeatHeader` : à répéter à chaque page. */
function Table({
  styles,
  columns,
  rows,
  total,
  repeatHeader = false,
}: {
  styles: Styles;
  columns: Column[];
  rows: string[][];
  total?: string[];
  repeatHeader?: boolean;
}) {
  return (
    <View>
      <View style={styles.th} fixed={repeatHeader}>
        {columns.map((c) => (
          <Text key={c.label} style={cellStyle(styles, c)}>
            {c.label}
          </Text>
        ))}
      </View>
      {rows.map((row, i) => (
        <View key={i} style={[styles.tr, i % 2 === 1 ? styles.trAlt : {}]} wrap={false}>
          {row.map((value, j) => (
            <Text key={j} style={cellStyle(styles, columns[j]!)}>
              {value}
            </Text>
          ))}
        </View>
      ))}
      {total && (
        <View style={styles.trTotal} wrap={false}>
          {total.map((value, j) => (
            <Text key={j} style={cellStyle(styles, columns[j]!)}>
              {value}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function Kpi({ styles, label, value, note }: { styles: Styles; label: string; value: string; note?: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {note && <Text style={styles.kpiNote}>{note}</Text>}
    </View>
  );
}

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;
const euros = formatEurosForPdf;

function SalesBody({ styles, report }: { styles: Styles; report: SalesReport }) {
  const t = report.totals;
  if (report.rows.length === 0) return <Text style={styles.empty}>Aucune facture ni aucun avoir sur la période.</Text>;
  return (
    <>
      <View style={styles.kpis}>
        <Kpi styles={styles} label="Total HT" value={euros(t.htCents)} />
        <Kpi styles={styles} label="TVA collectée" value={euros(t.vatCents)} />
        <Kpi styles={styles} label="Total TTC" value={euros(t.ttcCents)} />
        <Kpi
          styles={styles}
          label="Documents"
          value={String(t.invoiceCount + t.creditNoteCount)}
          note={`${plural(t.invoiceCount, "facture", "factures")}, ${plural(t.creditNoteCount, "avoir", "avoirs")}`}
        />
      </View>

      <Text style={styles.sectionTitle}>Récapitulatif par période</Text>
      <Table
        styles={styles}
        columns={[
          { label: "Période", flex: 1.4 },
          { label: "Factures", width: 50, align: "right" },
          { label: "Avoirs", width: 44, align: "right" },
          { label: "Total HT", width: 72, align: "right" },
          { label: "TVA", width: 66, align: "right" },
          { label: "Total TTC", width: 74, align: "right" },
        ]}
        rows={report.months.map((m) => [m.label, String(m.invoiceCount), String(m.creditNoteCount), euros(m.htCents), euros(m.vatCents), euros(m.ttcCents)])}
        total={["Total de la période", String(t.invoiceCount), String(t.creditNoteCount), euros(t.htCents), euros(t.vatCents), euros(t.ttcCents)]}
      />

      <Text style={styles.sectionTitle}>TVA par taux</Text>
      <Table
        styles={styles}
        columns={[
          { label: "Taux de TVA", flex: 1.4 },
          { label: "Base HT", width: 100, align: "right" },
          { label: "TVA", width: 100, align: "right" },
        ]}
        rows={report.vatByRate.map((r) => [formatRate(r.vatRatePer100000), euros(r.baseHtCents), euros(r.vatCents)])}
        total={["Total", euros(report.vatByRate.reduce((s, r) => s + r.baseHtCents, 0)), euros(t.vatCents)]}
      />

      <Text style={styles.sectionTitle}>Détail des écritures</Text>
      <Table
        styles={styles}
        repeatHeader
        columns={[
          { label: "Date", width: 50 },
          { label: "Type", width: 38 },
          { label: "Numéro", width: 62 },
          { label: "Client", flex: 1 },
          { label: "Total HT", width: 64, align: "right" },
          { label: "TVA", width: 56, align: "right" },
          { label: "Total TTC", width: 64, align: "right" },
          { label: "Statut", width: 58 },
        ]}
        rows={report.rows.map((r) => [
          formatDate(r.date),
          r.kind === "INVOICE" ? "Facture" : "Avoir",
          r.number,
          r.clientName,
          euros(r.htCents),
          euros(r.vatCents),
          euros(r.ttcCents),
          r.statusLabel,
        ])}
        total={["", "", "", "Total", euros(t.htCents), euros(t.vatCents), euros(t.ttcCents), ""]}
      />
      <Text style={styles.note}>Les avoirs sont comptés en négatif : ils viennent en déduction du chiffre d’affaires et de la TVA collectée.</Text>
    </>
  );
}

function PaymentsBody({ styles, report }: { styles: Styles; report: PaymentsReport }) {
  const t = report.totals;
  if (report.rows.length === 0) return <Text style={styles.empty}>Aucun encaissement sur la période.</Text>;
  return (
    <>
      <View style={styles.kpis}>
        <Kpi styles={styles} label="Total encaissé" value={euros(t.totalCents)} />
        <Kpi styles={styles} label="Paiements" value={String(t.count)} note={plural(report.byMethod.length, "moyen de paiement", "moyens de paiement")} />
      </View>

      <Text style={styles.sectionTitle}>Récapitulatif par période</Text>
      <Table
        styles={styles}
        columns={[
          { label: "Période", flex: 1.4 },
          { label: "Paiements", width: 70, align: "right" },
          { label: "Montant encaissé", width: 110, align: "right" },
        ]}
        rows={report.months.map((m) => [m.label, String(m.count), euros(m.totalCents)])}
        total={["Total de la période", String(t.count), euros(t.totalCents)]}
      />

      <Text style={styles.sectionTitle}>Par moyen de paiement</Text>
      <Table
        styles={styles}
        columns={[
          { label: "Moyen de paiement", flex: 1.4 },
          { label: "Paiements", width: 70, align: "right" },
          { label: "Montant encaissé", width: 110, align: "right" },
        ]}
        rows={report.byMethod.map((m) => [m.methodLabel, String(m.count), euros(m.totalCents)])}
        total={["Total", String(t.count), euros(t.totalCents)]}
      />

      <Text style={styles.sectionTitle}>Détail des encaissements</Text>
      <Table
        styles={styles}
        repeatHeader
        columns={[
          { label: "Date", width: 50 },
          { label: "Facture", width: 62 },
          { label: "Client", flex: 1 },
          { label: "Moyen", width: 74 },
          { label: "Référence", width: 84 },
          { label: "Montant", width: 64, align: "right" },
        ]}
        rows={report.rows.map((p) => [formatDate(p.paidAt), p.invoiceNumber, p.clientName, p.methodLabel, p.reference ?? "", euros(p.amountCents)])}
        total={["", "", "", "", "Total", euros(t.totalCents)]}
      />
    </>
  );
}

export function ExportReportPdf(input: ExportReportInput) {
  const { company, period, generatedAt } = input;
  const styles = makeStyles(company.brandColor);
  const title = REPORT_TITLES[input.kind];
  const logo = company.logo;
  const logoSize = logo ? fitLogo(logo, REPORT_LOGO_BOX) : undefined;
  const count = input.report.rows.length;

  return (
    // PDF/A-3b, comme les devis et factures : format d'archivage, polices intégrées.
    <Document
      title={`${title} ${periodLabel(period)}`}
      author={company.legalName}
      subject={`${title} de ${company.legalName}, ${periodLabel(period)}`}
      language="fr-FR"
      conformance="PDF/A-3b"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            {logo && logoSize && <Image src={{ data: logo.data, format: logo.format }} style={[styles.logo, logoSize]} />}
            <Text style={styles.company}>{company.legalName}</Text>
          </View>
          <View style={styles.titleBox}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.period}>{periodLabel(period)}</Text>
          </View>
        </View>

        <Text style={styles.meta}>
          Édité le {formatDate(generatedAt)} · {plural(count, "écriture", "écritures")} · montants en euros
        </Text>

        {input.kind === "SALES" ? <SalesBody styles={styles} report={input.report} /> : <PaymentsBody styles={styles} report={input.report} />}

        <PdfFooter lines={company.footerLines} />
      </Page>
    </Document>
  );
}
