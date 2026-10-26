/**
 * Valeurs candidates du paramètre ?godmode=… à tester contre le secret.
 *
 * URLSearchParams ne convient pas ici : il transforme « + » en espace et le
 * code VIP contient des caractères spéciaux (+, %, @) qu'un collage d'URL ne
 * protège pas. On lit donc la valeur brute et on propose, dans l'ordre, sa
 * version décodée (lien encodé proprement) puis la version brute (lien collé
 * tel quel). Aucune des deux ne prouve quoi que ce soit : seule la
 * comparaison au secret côté serveur décide.
 */
export function readGodmodeCandidates(search: string): string[] {
  const match = /[?&]godmode=([^&#]*)/.exec(search);
  const raw = match?.[1];
  if (!raw) return [];

  const candidates: string[] = [];
  try {
    candidates.push(decodeURIComponent(raw));
  } catch {
    // Séquence « % » invalide : seule la valeur brute est exploitable.
  }
  if (!candidates.includes(raw)) candidates.push(raw);
  return candidates;
}
