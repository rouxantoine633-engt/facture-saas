import { describe, expect, it } from "vitest";
import { formatDocumentNumber } from "./numbering";

describe("formatDocumentNumber", () => {
  it("formate avec année et zéros de remplissage", () => {
    expect(formatDocumentNumber({ prefix: "F", sequence: 1, year: 2026 })).toBe("F-2026-0001");
    expect(formatDocumentNumber({ prefix: "DEV", sequence: 123, year: 2026 })).toBe("DEV-2026-0123");
  });

  it("formate sans année (numérotation continue)", () => {
    expect(formatDocumentNumber({ prefix: "F", sequence: 42 })).toBe("F-00042");
  });

  it("dépasse le remplissage sans tronquer", () => {
    expect(formatDocumentNumber({ prefix: "F", sequence: 12345, year: 2026 })).toBe("F-2026-12345");
  });

  it("rejette une séquence invalide", () => {
    expect(() => formatDocumentNumber({ prefix: "F", sequence: 0 })).toThrow();
    expect(() => formatDocumentNumber({ prefix: "F", sequence: 1.5 })).toThrow();
  });
});
