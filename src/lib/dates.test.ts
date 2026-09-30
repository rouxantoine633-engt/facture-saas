import { describe, expect, it } from "vitest";
import { addUtcMonths, daysOverdue, monthKey, startOfUtcMonth } from "./dates";

describe("daysOverdue", () => {
  it("retourne 0 quand l'échéance n'est pas dépassée", () => {
    expect(daysOverdue(new Date("2026-09-15T00:00:00.000Z"), new Date("2026-09-15T08:00:00.000Z"))).toBe(0);
    expect(daysOverdue(new Date("2026-09-20T00:00:00.000Z"), new Date("2026-09-15T00:00:00.000Z"))).toBe(0);
  });

  it("compte les jours calendaires écoulés depuis l'échéance", () => {
    expect(daysOverdue(new Date("2026-09-01T00:00:00.000Z"), new Date("2026-09-15T00:00:00.000Z"))).toBe(14);
  });
});

describe("startOfUtcMonth", () => {
  it("ramène au premier jour du mois", () => {
    expect(startOfUtcMonth(new Date("2026-09-27T14:32:00.000Z")).toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });
});

describe("addUtcMonths", () => {
  it("avance ou recule de N mois calendaires", () => {
    expect(addUtcMonths(new Date("2026-09-15T00:00:00.000Z"), 2).toISOString()).toBe("2026-11-01T00:00:00.000Z");
    expect(addUtcMonths(new Date("2026-01-15T00:00:00.000Z"), -1).toISOString()).toBe("2025-12-01T00:00:00.000Z");
  });
});

describe("monthKey", () => {
  it("formate AAAA-MM avec zéro de tête", () => {
    expect(monthKey(new Date("2026-01-05T00:00:00.000Z"))).toBe("2026-01");
    expect(monthKey(new Date("2026-11-05T00:00:00.000Z"))).toBe("2026-11");
  });
});
