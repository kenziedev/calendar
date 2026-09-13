import { test } from "node:test";
import assert from "node:assert/strict";
import {
  monthDays,
  occurrences,
  newEvent,
  shiftMonth,
} from "../lib/calendar.ts";
const event = (overrides = {}) => ({
  ...newEvent("2026-01-31"),
  id: "test",
  title: "약속",
  ...overrides,
});
test("month grid covers all days and handles year rollover", () => {
  assert.equal(shiftMonth("2026-12-01", 1), "2027-01-01");
  const days = monthDays("2026-08-01");
  assert.equal(days.length, 42);
  assert.ok(days.includes("2026-08-31"));
});
test("monthly recurrence skips nonexistent dates without drifting", () => {
  const list = occurrences(
    [event({ endDate: "2026-01-31", repeat: "monthly" })],
    "2026-02-01",
    "2026-04-30",
  );
  assert.deepEqual(
    list.map((e) => e.startDate),
    ["2026-03-31"],
  );
});
test("yearly leap day occurs only in leap years", () => {
  const e = event({
    startDate: "2024-02-29",
    endDate: "2024-02-29",
    repeat: "yearly",
  });
  assert.equal(occurrences([e], "2025-01-01", "2025-12-31").length, 0);
  assert.equal(
    occurrences([e], "2028-01-01", "2028-12-31")[0].startDate,
    "2028-02-29",
  );
});
test("multi-day weekly event crosses month and honors inclusive repeat end", () => {
  const e = event({
    startDate: "2026-08-31",
    endDate: "2026-09-02",
    allDay: true,
    repeat: "weekly",
    repeatUntil: "2026-09-07",
  });
  const list = occurrences([e], "2026-09-01", "2026-09-30");
  assert.deepEqual(
    list.map((e) => e.startDate),
    ["2026-08-31", "2026-09-07"],
  );
  assert.equal(occurrences([e], "2026-09-09", "2026-09-09").length, 1);
  assert.equal(occurrences([e], "2026-09-10", "2026-09-10").length, 0);
});
test("midnight time endpoint is exclusive but all-day end is inclusive", () => {
  const e = event({
    startDate: "2026-09-13",
    endDate: "2026-09-14",
    startTime: "23:00",
    endTime: "00:00",
  });
  assert.equal(occurrences([e], "2026-09-14", "2026-09-14").length, 0);
  assert.equal(
    occurrences([{ ...e, allDay: true }], "2026-09-14", "2026-09-14").length,
    1,
  );
});
