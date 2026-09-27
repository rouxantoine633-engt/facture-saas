import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function assert(cond, msg) {
  if (!cond) throw new Error(`ÉCHEC: ${msg}`);
  console.log(`OK: ${msg}`);
}

async function main() {
  const user = await prisma.user.create({
    data: { email: `smoke-${Date.now()}@example.fr`, passwordHash: "x", name: "Test" },
  });

  const company = await prisma.company.create({
    data: {
      ownerId: user.id,
      legalName: "Jean Dupont",
      legalForm: "AUTO_ENTREPRENEUR",
      siren: "123456789",
      siret: "12345678900012",
      vatRegime: "FRANCHISE_EN_BASE",
      addressLine1: "1 rue de la Paix",
      postalCode: "75002",
      city: "Paris",
      email: "jean@example.fr",
    },
  });

  const client = await prisma.client.create({
    data: {
      companyId: company.id,
      type: "BUSINESS",
      name: "ACME SAS",
      addressLine1: "2 avenue Foch",
      postalCode: "69001",
      city: "Lyon",
    },
  });

  // Numérotation atomique : deux devis à la suite doivent recevoir des numéros distincts et séquentiels.
  const n1 = await prisma.$transaction((tx) =>
    tx.documentCounter
      .upsert({
        where: { companyId_documentType: { companyId: company.id, documentType: "QUOTE" } },
        create: { companyId: company.id, documentType: "QUOTE", prefix: "DEV", yearlyReset: true, currentYear: 2026, lastNumber: 1 },
        update: { lastNumber: { increment: 1 } },
      })
      .then((c) => c.lastNumber)
  );
  const n2 = await prisma.$transaction((tx) =>
    tx.documentCounter
      .update({ where: { companyId_documentType: { companyId: company.id, documentType: "QUOTE" } }, data: { lastNumber: { increment: 1 } } })
      .then((c) => c.lastNumber)
  );
  assert(n2 === n1 + 1, `numérotation séquentielle sans trou (${n1} -> ${n2})`);

  const invoice = await prisma.invoice.create({
    data: {
      companyId: company.id,
      clientId: client.id,
      number: `BROUILLON-${Date.now()}`,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 86400000),
      subtotalHtCents: 10000,
      totalVatCents: 0,
      totalTtcCents: 10000,
      lines: {
        create: [{ position: 1, description: "Prestation", quantity: "1", unitPriceCents: 10000, vatRatePer100000: 0, lineHtCents: 10000, lineVatCents: 0, lineTtcCents: 10000 }],
      },
    },
  });
  assert(invoice.status === "DRAFT", "facture créée en brouillon");

  const emitted = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      number: "F-2026-0001",
      status: "SENT",
      emittedAt: new Date(),
      sellerLegalSnapshot: { legalName: company.legalName },
      buyerLegalSnapshot: { name: client.name },
    },
  });
  assert(emitted.status === "SENT", "facture émise avec succès (encore brouillon jusque-là)");

  // Le trigger SQL doit bloquer toute modification une fois la facture émise.
  let blocked = false;
  try {
    await prisma.invoice.update({ where: { id: invoice.id }, data: { totalTtcCents: 99999 } });
  } catch (e) {
    blocked = String(e).includes("non modifiable");
  }
  assert(blocked, "le trigger SQL bloque la modification d'une facture émise");

  let blockedDelete = false;
  try {
    await prisma.invoice.delete({ where: { id: invoice.id } });
  } catch (e) {
    blockedDelete = String(e).includes("non supprimable");
  }
  assert(blockedDelete, "le trigger SQL bloque la suppression d'une facture émise");

  // Le statut technique (updatedAt, pdfStorageKey) peut évoluer sans déclencher le trigger.
  const pdfUpdate = await prisma.invoice.update({ where: { id: invoice.id }, data: { pdfStorageKey: "test.pdf" } });
  assert(pdfUpdate.pdfStorageKey === "test.pdf", "pdfStorageKey reste modifiable après émission");

  console.log("\nTous les contrôles de fumée sont passés.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
