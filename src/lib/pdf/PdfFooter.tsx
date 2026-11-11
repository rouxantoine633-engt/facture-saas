import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { PDF_FONT } from "./fonts";

/** Place à réserver en bas de page (padding du `Page`) pour les mentions légales, jusqu'à 4 lignes. */
export const PAGE_BOTTOM_PADDING = 92;

const styles = StyleSheet.create({
  footer: {
    position: "absolute",
    bottom: 22,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: "#d1d5db",
    fontFamily: PDF_FONT,
    fontSize: 7,
    color: "#4b5563",
  },
  // Pas de `lineHeight` sur ce bloc : en position absolue, react-pdf le fait sortir de la page.
  footerLegal: { flex: 1, paddingRight: 16 },
  footerLine: { marginBottom: 1.5 },
  footerPage: { width: 46, textAlign: "right", fontSize: 7.5 },
});

/** Pied de page répété sur chaque page : mentions légales de l'émetteur et numéro de page. */
export function PdfFooter({ lines }: { lines: string[] }) {
  return (
    <View style={styles.footer} fixed>
      <View style={styles.footerLegal}>
        {lines.map((l, i) => (
          <Text key={i} style={styles.footerLine}>
            {l}
          </Text>
        ))}
      </View>
      <Text style={styles.footerPage} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
    </View>
  );
}
