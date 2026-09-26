export class EmailError extends Error {}

export interface OutgoingEmail {
  to: { email: string; name?: string };
  subject: string;
  text: string;
  html: string;
  replyTo?: { email: string; name?: string };
  senderName?: string;
  attachments?: Array<{ name: string; content: Buffer }>;
}

/**
 * Envoi via l'API transactionnelle Brevo. L'expéditeur reste toujours l'adresse
 * vérifiée de la plateforme (EMAIL_FROM) : l'adresse de l'utilisateur est
 * placée en « reply-to » pour éviter l'usurpation d'expéditeur (SPF/DKIM).
 */
export async function sendEmail(mail: OutgoingEmail): Promise<{ messageId: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw new EmailError("L'envoi d'emails n'est pas encore configuré sur ce service.");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { email: from, name: mail.senderName },
      to: [mail.to],
      replyTo: mail.replyTo,
      subject: mail.subject,
      textContent: mail.text,
      htmlContent: mail.html,
      attachment: mail.attachments?.map((a) => ({ name: a.name, content: a.content.toString("base64") })),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("Échec d'envoi Brevo", response.status, detail);
    throw new EmailError("L'email n'a pas pu être envoyé. Réessayez dans quelques instants.");
  }

  const body = (await response.json().catch(() => ({}))) as { messageId?: string };
  return { messageId: body.messageId ?? "" };
}
