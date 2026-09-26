import { describe, expect, it } from "vitest";
import { isOverdue, startOfUtcDay } from "./dates";
import { isFirmReminder, normalizeOffsets, parseOffsetsInput, planReminders } from "./reminders";

const due = new Date("2026-03-10T00:00:00Z");
const at = (iso: string) => new Date(iso);

describe("planReminders", () => {
  it("n'envoie rien avant le premier palier", () => {
    const plan = planReminders({ dueDate: due, offsetsDays: [7, 15], existing: [], now: at("2026-03-16T23:59:00Z") });
    expect(plan).toEqual({ toSend: null, toCancel: [] });
  });

  it("envoie J+7 le jour J+7", () => {
    const plan = planReminders({ dueDate: due, offsetsDays: [7, 15], existing: [], now: at("2026-03-17T08:00:00Z") });
    expect(plan).toEqual({ toSend: 7, toCancel: [] });
  });

  it("n'envoie pas deux fois un palier déjà envoyé", () => {
    const plan = planReminders({
      dueDate: due,
      offsetsDays: [7, 15],
      existing: [{ offsetDays: 7, status: "SENT" }],
      now: at("2026-03-18T08:00:00Z"),
    });
    expect(plan).toEqual({ toSend: null, toCancel: [] });
  });

  it("envoie J+15 après J+7", () => {
    const plan = planReminders({
      dueDate: due,
      offsetsDays: [7, 15],
      existing: [{ offsetDays: 7, status: "SENT" }],
      now: at("2026-03-25T08:00:00Z"),
    });
    expect(plan).toEqual({ toSend: 15, toCancel: [] });
  });

  it("après une interruption, n'envoie que le palier le plus récent et annule l'autre", () => {
    const plan = planReminders({ dueDate: due, offsetsDays: [7, 15], existing: [], now: at("2026-03-30T08:00:00Z") });
    expect(plan).toEqual({ toSend: 15, toCancel: [7] });
  });

  it("ne rejoue pas un palier inférieur à un palier déjà envoyé", () => {
    const plan = planReminders({
      dueDate: due,
      offsetsDays: [7, 15],
      existing: [{ offsetDays: 15, status: "SENT" }],
      now: at("2026-03-30T08:00:00Z"),
    });
    expect(plan).toEqual({ toSend: null, toCancel: [7] });
  });

  it("retente un envoi échoué", () => {
    const plan = planReminders({
      dueDate: due,
      offsetsDays: [7],
      existing: [{ offsetDays: 7, status: "FAILED" }],
      now: at("2026-03-18T08:00:00Z"),
    });
    expect(plan.toSend).toBe(7);
  });

  it("ne relance pas quand les relances sont désactivées", () => {
    const plan = planReminders({ dueDate: due, offsetsDays: [], existing: [], now: at("2026-06-01T08:00:00Z") });
    expect(plan).toEqual({ toSend: null, toCancel: [] });
  });
});

describe("offsets", () => {
  it("normalise : dédoublonne, trie, écarte les valeurs invalides", () => {
    expect(normalizeOffsets([15, 7, 7, 0, -3, 2.5])).toEqual([7, 15]);
  });

  it("parse la saisie utilisateur", () => {
    expect(parseOffsetsInput("15, 7;abc 7")).toEqual([7, 15]);
    expect(parseOffsetsInput("")).toEqual([]);
  });

  it("qualifie de ferme toute relance après la première", () => {
    expect(isFirmReminder(7, [7, 15])).toBe(false);
    expect(isFirmReminder(15, [7, 15])).toBe(true);
    expect(isFirmReminder(7, [7])).toBe(false);
  });
});

describe("dates", () => {
  it("n'est pas en retard le jour même de l'échéance", () => {
    expect(isOverdue(due, at("2026-03-10T23:59:00Z"))).toBe(false);
  });

  it("est en retard dès le lendemain", () => {
    expect(isOverdue(due, at("2026-03-11T00:00:00Z"))).toBe(true);
  });

  it("calcule le début de journée UTC", () => {
    expect(startOfUtcDay(at("2026-03-10T15:42:00Z")).toISOString()).toBe("2026-03-10T00:00:00.000Z");
  });
});
