import { describe, expect, it } from "vitest";
import { buildDocumentEmail, buildReminderEmail, escapeHtml } from "./templates";

const base = {
  kind: "INVOICE" as const,
  companyName: "Jean Dupont",
  clientName: "ACME SAS",
  number: "F-2026-0001",
  totalTtcLabel: "120,00 €",
  dueDateLabel: "09/02/2026",
};

describe("buildDocumentEmail", () => {
  it("construit un email de facture avec montant et échéance", () => {
    const mail = buildDocumentEmail(base);
    expect(mail.subject).toBe("Facture F-2026-0001 de Jean Dupont");
    expect(mail.text).toContain("120,00 € TTC");
    expect(mail.text).toContain("à régler avant le 09/02/2026");
  });

  it("construit un email de devis avec sa validité", () => {
    const mail = buildDocumentEmail({ ...base, kind: "QUOTE", number: "DEV-2026-0001", validUntilLabel: "10/02/2026" });
    expect(mail.subject).toBe("Devis DEV-2026-0001 de Jean Dupont");
    expect(mail.text).toContain("valable jusqu'au 10/02/2026");
  });

  it("échappe le HTML dans le message personnalisé", () => {
    const mail = buildDocumentEmail({ ...base, customMessage: '<script>alert("x")</script>' });
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
  });

  it("neutralise l'injection d'en-tête dans l'objet", () => {
    const mail = buildDocumentEmail({ ...base, companyName: "Evil\r\nBcc: victime@example.com" });
    expect(mail.subject).not.toMatch(/[\r\n]/);
  });
});

describe("escapeHtml", () => {
  it("échappe les caractères spéciaux", () => {
    expect(escapeHtml(`<a href="x">&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;");
  });
});

describe("buildReminderEmail", () => {
  const reminder = {
    companyName: "Jean Dupont",
    clientName: "ACME SAS",
    number: "F-2026-0001",
    amountDueLabel: "120,00 €",
    dueDateLabel: "10/03/2026",
    firm: false,
    businessClient: true,
    recoveryIndemnityLabel: "40,00 €",
  };

  it("première relance : courtoise, sans mention de pénalités", () => {
    const mail = buildReminderEmail(reminder);
    expect(mail.subject).toBe("Rappel : facture F-2026-0001 échue le 10/03/2026");
    expect(mail.text).toContain("120,00 € TTC");
    expect(mail.text).not.toContain("pénalités");
  });

  it("relance ferme : rappelle pénalités et indemnité de 40 € entre professionnels", () => {
    const mail = buildReminderEmail({ ...reminder, firm: true });
    expect(mail.subject).toContain("Relance");
    expect(mail.text).toContain("pénalités de retard et une indemnité forfaitaire");
    expect(mail.text).toContain("40,00 €");
  });

  it("relance ferme à un particulier : pas d'indemnité forfaitaire", () => {
    const mail = buildReminderEmail({ ...reminder, firm: true, businessClient: false });
    expect(mail.text).toContain("pénalités de retard");
    expect(mail.text).not.toContain("indemnité");
  });

  it("neutralise l'injection d'en-tête dans l'objet", () => {
    const mail = buildReminderEmail({ ...reminder, number: "F-1\r\nBcc: x@y.z" });
    expect(mail.subject).not.toMatch(/[\r\n]/);
  });
});
