export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Empêche l'injection d'en-têtes (retours à la ligne) via un nom d'entreprise ou de client. */
function singleLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export interface DocumentEmailInput {
  kind: "INVOICE" | "QUOTE";
  companyName: string;
  clientName: string;
  number: string;
  totalTtcLabel: string;
  dueDateLabel?: string; // facture
  validUntilLabel?: string; // devis
  customMessage?: string;
}

export interface BuiltEmail {
  subject: string;
  text: string;
  html: string;
}

export function buildDocumentEmail(i: DocumentEmailInput): BuiltEmail {
  const company = singleLine(i.companyName);
  const isInvoice = i.kind === "INVOICE";
  const noun = isInvoice ? "facture" : "devis";

  const subject = `${isInvoice ? "Facture" : "Devis"} ${singleLine(i.number)} de ${company}`;

  const paragraphs = [
    `Bonjour ${singleLine(i.clientName)},`,
    isInvoice
      ? `Veuillez trouver ci-joint la facture n° ${i.number} d'un montant de ${i.totalTtcLabel} TTC${
          i.dueDateLabel ? `, à régler avant le ${i.dueDateLabel}` : ""
        }.`
      : `Veuillez trouver ci-joint le devis n° ${i.number} d'un montant de ${i.totalTtcLabel} TTC${
          i.validUntilLabel ? `, valable jusqu'au ${i.validUntilLabel}` : ""
        }.`,
  ];
  if (i.customMessage?.trim()) paragraphs.push(i.customMessage.trim());
  paragraphs.push(`Le ${noun} est joint à cet email au format PDF.`, `Cordialement,\n${company}`);

  const text = paragraphs.join("\n\n");
  const html = paragraphs
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("\n");

  return { subject, text, html };
}

export interface ReminderEmailInput {
  companyName: string;
  clientName: string;
  number: string;
  amountDueLabel: string;
  dueDateLabel: string;
  /** 2e relance ou plus : rappelle les pénalités et l'indemnité de recouvrement. */
  firm: boolean;
  /** L'indemnité de 40 € n'est due qu'entre professionnels. */
  businessClient: boolean;
  recoveryIndemnityLabel?: string;
}

export function buildReminderEmail(i: ReminderEmailInput): BuiltEmail {
  const company = singleLine(i.companyName);
  const subject = `${i.firm ? "Relance" : "Rappel"} : facture ${singleLine(i.number)} échue le ${i.dueDateLabel}`;

  const paragraphs = [
    `Bonjour ${singleLine(i.clientName)},`,
    `Sauf erreur de notre part, la facture n° ${i.number}, d'un montant restant dû de ${i.amountDueLabel} TTC et échue le ${i.dueDateLabel}, n'a pas encore été réglée.`,
  ];
  if (i.firm) {
    paragraphs.push(
      i.businessClient && i.recoveryIndemnityLabel
        ? `Conformément aux conditions de règlement mentionnées sur la facture, des pénalités de retard et une indemnité forfaitaire pour frais de recouvrement de ${i.recoveryIndemnityLabel} sont exigibles.`
        : "Conformément aux conditions de règlement mentionnées sur la facture, des pénalités de retard sont exigibles."
    );
  }
  paragraphs.push(
    "La facture est jointe à cet email. Si le règlement a été effectué entre-temps, merci de ne pas tenir compte de ce message.",
    `Cordialement,\n${company}`
  );

  return {
    subject,
    text: paragraphs.join("\n\n"),
    html: paragraphs.map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`).join("\n"),
  };
}
