/** Contrôle d'un logo téléversé : format réel (signature des octets, pas l'extension), poids et dimensions. */

export const MAX_LOGO_BYTES = 300 * 1024;
export const MAX_LOGO_DIMENSION = 4000;

export type LogoInspection =
  | { ok: true; format: "png" | "jpg"; mimeType: "image/png" | "image/jpeg"; width: number; height: number }
  | { ok: false; error: string };

const fail = (error: string): LogoInspection => ({ ok: false, error });

function inspectPng(b: Uint8Array): LogoInspection {
  if (b.length < 33) return fail("Le fichier PNG est incomplet.");
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const width = view.getUint32(16);
  const height = view.getUint32(20);
  const interlaced = b[28] === 1;
  if (interlaced) return fail("Le PNG entrelacé n'est pas pris en charge : exportez-le sans entrelacement.");
  return { ok: true, format: "png", mimeType: "image/png", width, height };
}

function inspectJpeg(b: Uint8Array): LogoInspection {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return fail("Le fichier JPEG est invalide.");
    const marker = b[i + 1]!;
    if (marker === 0xff) {
      i += 1;
      continue;
    }
    const length = (b[i + 2]! << 8) | b[i + 3]!;
    const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isStartOfFrame) {
      const height = (b[i + 5]! << 8) | b[i + 6]!;
      const width = (b[i + 7]! << 8) | b[i + 8]!;
      const components = b[i + 9]!;
      if (components === 4) return fail("Le JPEG en couleurs CMJN n'est pas pris en charge : enregistrez-le en RVB.");
      return { ok: true, format: "jpg", mimeType: "image/jpeg", width, height };
    }
    i += 2 + length;
  }
  return fail("Le fichier JPEG est invalide.");
}

export function inspectLogo(bytes: Uint8Array): LogoInspection {
  if (bytes.length === 0) return fail("Le fichier est vide.");
  if (bytes.length > MAX_LOGO_BYTES) {
    return fail(`Le logo est trop lourd (${Math.round(MAX_LOGO_BYTES / 1024)} Ko maximum).`);
  }
  const isPng = bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isJpeg = bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const result = isPng ? inspectPng(bytes) : isJpeg ? inspectJpeg(bytes) : fail("Formats acceptés : PNG ou JPEG.");
  if (!result.ok) return result;
  if (result.width < 1 || result.height < 1 || result.width > MAX_LOGO_DIMENSION || result.height > MAX_LOGO_DIMENSION) {
    return fail(`Les dimensions du logo doivent être comprises entre 1 et ${MAX_LOGO_DIMENSION} pixels.`);
  }
  return result;
}
