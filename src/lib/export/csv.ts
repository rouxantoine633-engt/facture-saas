const BOM = "﻿";
const SEPARATOR = ";";
const EOL = "\r\n";

/**
 * Texte libre saisi par un utilisateur (nom de client, référence de paiement) :
 * neutralise l'injection de formules (=, +, -, @, tabulation) à l'ouverture dans Excel,
 * puis échappe pour le CSV.
 */
export function csvText(value: string | null | undefined): string {
  let text = (value ?? "").replace(/\r?\n/g, " ");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[";]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Montant en centimes → « 1234,56 » (virgule décimale, sans séparateur de milliers), en arithmétique entière. */
export function csvAmount(cents: number): string {
  if (!Number.isInteger(cents)) throw new Error("csvAmount attend un entier (centimes)");
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.trunc(abs / 100)},${String(abs % 100).padStart(2, "0")}`;
}

/** Les cellules doivent déjà être formatées (csvText / csvAmount). */
export function toCsv(rows: string[][]): string {
  return BOM + rows.map((row) => row.join(SEPARATOR)).join(EOL) + EOL;
}
