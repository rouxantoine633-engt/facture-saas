import { describe, expect, it } from "vitest";
import { parseExportRange } from "./range";

describe("parseExportRange", () => {
  it("inclut toute la journée de fin", () => {
    const r = parseExportRange("2026-01-01", "2026-12-31");
    expect(r).toEqual({ from: new Date("2026-01-01T00:00:00.000Z"), to: new Date("2026-12-31T23:59:59.999Z") });
  });
  it("refuse les dates absentes ou mal formées", () => {
    expect(parseExportRange(null, "2026-12-31")).toHaveProperty("error");
    expect(parseExportRange("01/01/2026", "2026-12-31")).toHaveProperty("error");
    expect(parseExportRange("2026-13-45", "2026-12-31")).toHaveProperty("error");
  });
  it("refuse une fin avant le début", () => {
    expect(parseExportRange("2026-03-01", "2026-02-01")).toHaveProperty("error");
  });
  it("refuse une période trop longue", () => {
    expect(parseExportRange("2000-01-01", "2026-12-31")).toHaveProperty("error");
  });
  it("accepte un seul jour", () => {
    expect(parseExportRange("2026-05-05", "2026-05-05")).not.toHaveProperty("error");
  });
});
