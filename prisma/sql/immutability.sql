-- Immutabilité des factures émises, garantie au niveau base de données.
-- À appliquer APRÈS `prisma migrate` (psql -f prisma/sql/immutability.sql),
-- ou à copier dans une migration Prisma personnalisée.
-- Une facture émise (status <> 'DRAFT') ne peut être ni supprimée ni voir ses
-- champs légaux modifiés ; seuls le statut de paiement, l'horodatage technique
-- et la clé du PDF peuvent évoluer. Les avoirs sont le seul moyen de correction.

CREATE OR REPLACE FUNCTION guard_emitted_invoice() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD."status" <> 'DRAFT' THEN
      RAISE EXCEPTION 'Facture émise non supprimable : créez un avoir.';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD."status" <> 'DRAFT' THEN
    IF (to_jsonb(NEW) - 'status' - 'updatedAt' - 'pdfStorageKey')
       IS DISTINCT FROM
       (to_jsonb(OLD) - 'status' - 'updatedAt' - 'pdfStorageKey') THEN
      RAISE EXCEPTION 'Facture émise non modifiable : créez un avoir.';
    END IF;
    IF NEW."status" = 'DRAFT' THEN
      RAISE EXCEPTION 'Une facture émise ne peut pas redevenir brouillon.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoices_guard ON "invoices";
CREATE TRIGGER invoices_guard
  BEFORE UPDATE OR DELETE ON "invoices"
  FOR EACH ROW EXECUTE FUNCTION guard_emitted_invoice();

CREATE OR REPLACE FUNCTION guard_emitted_invoice_lines() RETURNS trigger AS $$
DECLARE
  parent_id text;
  parent_status text;
BEGIN
  parent_id := CASE WHEN TG_OP = 'DELETE' THEN OLD."invoiceId" ELSE NEW."invoiceId" END;
  SELECT "status"::text INTO parent_status FROM "invoices" WHERE "id" = parent_id;
  IF parent_status IS NOT NULL AND parent_status <> 'DRAFT' THEN
    RAISE EXCEPTION 'Lignes d''une facture émise non modifiables : créez un avoir.';
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS invoice_lines_guard ON "invoice_lines";
CREATE TRIGGER invoice_lines_guard
  BEFORE INSERT OR UPDATE OR DELETE ON "invoice_lines"
  FOR EACH ROW EXECUTE FUNCTION guard_emitted_invoice_lines();

-- Avoirs : émis dès leur création, donc immuables (ni modification ni suppression).
CREATE OR REPLACE FUNCTION forbid_credit_note_change() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Un avoir est non modifiable : émettez un nouvel avoir si nécessaire.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS credit_notes_guard ON "credit_notes";
CREATE TRIGGER credit_notes_guard
  BEFORE UPDATE OR DELETE ON "credit_notes"
  FOR EACH ROW EXECUTE FUNCTION forbid_credit_note_change();

DROP TRIGGER IF EXISTS credit_note_lines_guard ON "credit_note_lines";
CREATE TRIGGER credit_note_lines_guard
  BEFORE UPDATE OR DELETE ON "credit_note_lines"
  FOR EACH ROW EXECUTE FUNCTION forbid_credit_note_change();
