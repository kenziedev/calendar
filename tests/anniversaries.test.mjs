import { test } from "node:test";
import assert from "node:assert/strict";
import {
  anniversaryOccurrences,
  newAnniversary,
} from "../lib/anniversaries.ts";

const anniversary = (overrides = {}) => ({
  ...newAnniversary("2026-01-01"),
  id: "anniversary-test",
  title: "우리",
  ...overrides,
});
const entries = (rows, from, to) =>
  anniversaryOccurrences(rows, from, to).map(({ date, title, label }) => ({
    date, title, label,
  }));

test("new anniversary uses shared inclusive counting defaults and a creation id", () => {
  const value = newAnniversary("2026-09-29");
  assert.deepEqual({ ...value, createId: undefined }, {
    id: "", createId: undefined, title: "", owner: "together",
    kind: "anniversary", startDate: "2026-09-29", yearly: true,
    each100: true, countFromOne: true, version: 0,
  });
  assert.match(value.createId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});

test("100-day milestones differ by one day for inclusive and elapsed counting", () => {
  const base = anniversary({ yearly: false });
  assert.deepEqual(entries([base], "2026-04-09", "2026-04-12"), [
    { date: "2026-04-10", title: "우리 · 100일", label: "100일" },
  ]);
  assert.deepEqual(entries([{ ...base, countFromOne: false }], "2026-04-09", "2026-04-12"), [
    { date: "2026-04-11", title: "우리 · 100일", label: "100일" },
  ]);
  assert.deepEqual(entries([base], "2026-07-19", "2026-07-19"), [
    { date: "2026-07-19", title: "우리 · 200일", label: "200일" },
  ]);
});

test("anniversaries include the start date and years one and two, never year zero", () => {
  assert.deepEqual(entries([anniversary({ each100: false })], "2026-01-01", "2028-01-01"), [
    { date: "2026-01-01", title: "우리 · 시작일", label: "시작일" },
    { date: "2027-01-01", title: "우리 · 1주년", label: "1주년" },
    { date: "2028-01-01", title: "우리 · 2주년", label: "2주년" },
  ]);
});

test("disabled repeat options leave only the original start day", () => {
  assert.deepEqual(entries([anniversary({ yearly: false, each100: false })], "2026-01-01", "2030-12-31"), [
    { date: "2026-01-01", title: "우리 · 시작일", label: "시작일" },
  ]);
});

test("birthdays repeat from their base year, never add a duplicate suffix or day milestones", () => {
  const birthday = anniversary({ kind: "birthday", title: "현쪼기", yearly: false });
  assert.deepEqual(entries([birthday], "2026-01-01", "2027-12-31"), [
    { date: "2026-01-01", title: "현쪼기 생일", label: "생일" },
    { date: "2027-01-01", title: "현쪼기 생일", label: "생일" },
  ]);
  assert.equal(anniversaryOccurrences([{ ...birthday, title: "쩡개굴 생일" }], "2026-01-01", "2026-01-01")[0].title, "쩡개굴 생일");
});

test("future start dates never create earlier birthdays or milestones", () => {
  for (const kind of ["birthday", "anniversary"]) {
    const row = anniversary({ kind, startDate: "2028-12-20" });
    assert.deepEqual(anniversaryOccurrences([row], "2026-01-01", "2028-12-19"), []);
    assert.equal(anniversaryOccurrences([row], "2028-12-20", "2028-12-20").length, 1);
  }
});

test("February 29 falls on February 28 in ordinary years and returns to February 29", () => {
  for (const kind of ["birthday", "anniversary"]) {
    const row = anniversary({ kind, startDate: "2024-02-29", each100: false });
    assert.deepEqual(anniversaryOccurrences([row], "2024-01-01", "2028-12-31").map((entry) => entry.date), [
      "2024-02-29", "2025-02-28", "2026-02-28", "2027-02-28", "2028-02-29",
    ]);
    assert.deepEqual(anniversaryOccurrences([row], "2028-02-28", "2028-02-28"), []);
  }
});

test("Gregorian century rules make 2100 a non-leap year", () => {
  const row = anniversary({ kind: "birthday", startDate: "2000-02-29" });
  assert.deepEqual(anniversaryOccurrences([row], "2100-02-01", "2100-03-01").map((entry) => entry.date), ["2100-02-28"]);
});

test("annual and 100-day milestones on the same day retain distinct stable keys", () => {
  const row = anniversary({ startDate: "2025-01-01", countFromOne: false });
  const singleDay = anniversaryOccurrences([row], "2048-01-01", "2048-01-01");
  assert.deepEqual(singleDay.map((entry) => entry.label).sort(), ["23주년", "8400일"]);
  assert.equal(new Set(singleDay.map((entry) => entry.key)).size, 2);
  assert.deepEqual(
    anniversaryOccurrences([row], "2047-12-01", "2048-01-31")
      .filter((entry) => entry.date === "2048-01-01").map((entry) => entry.key),
    singleDay.map((entry) => entry.key),
  );
});

test("range endpoints are inclusive and adjacent dates do not leak into the result", () => {
  const row = anniversary({ yearly: false });
  assert.equal(anniversaryOccurrences([row], "2026-04-10", "2026-04-10").length, 1);
  assert.deepEqual(anniversaryOccurrences([row], "2026-04-09", "2026-04-09"), []);
  assert.deepEqual(anniversaryOccurrences([row], "2026-04-11", "2026-04-11"), []);
  assert.deepEqual(anniversaryOccurrences([row], "2026-05-01", "2026-04-01"), []);
});

test("supported years clamp wide queries and never emit an out-of-range date", () => {
  const row = anniversary({ startDate: "1900-01-01" });
  const list = anniversaryOccurrences([row], "1899-01-01", "2101-12-31");
  assert.ok(list.length > 0);
  assert.ok(list.every((entry) => entry.date >= "1900-01-01" && entry.date <= "2100-12-31"));
  assert.equal(list[0].date, "1900-01-01");
  assert.deepEqual(anniversaryOccurrences([row], "2101-01-01", "2101-12-31"), []);
  assert.deepEqual(anniversaryOccurrences([row], "1899-01-01", "1899-12-31"), []);
  assert.deepEqual(anniversaryOccurrences([anniversary({ startDate: "2100-12-31" })], "2100-12-31", "2101-12-31").map((entry) => entry.date), ["2100-12-31"]);
});

test("invalid or unsupported starts and malformed range dates are ignored", () => {
  for (const startDate of ["1899-12-31", "2101-01-01", "2026-02-29", "2026-13-01", "bad"]) {
    assert.deepEqual(anniversaryOccurrences([anniversary({ startDate })], "1899-01-01", "2101-12-31"), []);
  }
  assert.deepEqual(anniversaryOccurrences([anniversary()], "2026-02-30", "2026-12-31"), []);
  assert.deepEqual(anniversaryOccurrences([anniversary()], "2026-01-01", "bad"), []);
});

test("results sort by date then title without changing input rows", () => {
  const rows = [
    anniversary({ id: "z", title: "Z", startDate: "2026-05-01", each100: false }),
    anniversary({ id: "b", title: "B", startDate: "2026-01-01", each100: false }),
    anniversary({ id: "a", title: "A", startDate: "2026-01-01", each100: false }),
  ];
  const before = structuredClone(rows);
  const list = anniversaryOccurrences(rows, "2026-01-01", "2026-12-31");
  assert.deepEqual(list.map((entry) => entry.title), ["A · 시작일", "B · 시작일", "Z · 시작일"]);
  assert.deepEqual(rows, before);
  assert.equal(list[0].anniversary, rows[2]);
});
