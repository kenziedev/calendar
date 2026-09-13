import test from "node:test";
import assert from "node:assert/strict";
import {
  parseHolidays,
  loadHolidays,
  HOLIDAY_TTL,
  HOLIDAY_RETRY,
} from "../lib/holidays.ts";

const year = Object.fromEntries(
  Array.from({ length: 10 }, (_, i) => [
    `2025-01-${String(i + 1).padStart(2, "0")}`,
    ["테스트 공휴일"],
  ]),
);
const fixture = () => ({
  2025: {
    ...year,
    "2025-01-27": ["임시공휴일"],
    "2025-05-05": ["어린이날", "부처님 오신 날"],
  },
});
const now = 2 * HOLIDAY_TTL;
const cache = () => ({
  payload: JSON.stringify(fixture()),
  etag: '"v1"',
  updatedAt: 1,
  retryAt: 0,
});

test("preserves multiple holidays and identifies supported years", () => {
  const parsed = parseHolidays(fixture());
  assert.deepEqual(parsed.holidays["2025-05-05"], [
    "어린이날",
    "부처님 오신 날",
  ]);
  assert.equal(parsed.holidays["2025-01-27"][0], "임시공휴일");
  assert.deepEqual(parsed.years, [2025]);
  assert.equal(parsed.years.includes(2028), false);
});
test("rejects malformed, empty or impossible date data", () => {
  for (const input of [
    {},
    [],
    { 2025: {} },
    { 2025: { ...year, "2025-02-30": ["잘못된 날짜"] } },
    { 2025: { ...year, "2025-12-25": [""] } },
  ]) {
    assert.throws(() => parseHolidays(input));
  }
});
test("fresh cache avoids upstream; ETag 304 renews successful check", async () => {
  const fresh = { ...cache(), updatedAt: now - 1000 };
  const result = await loadHolidays({
    now,
    read: async () => fresh,
    write: async () => assert.fail(),
    fetcher: async () => assert.fail(),
  });
  assert.equal(result.stale, false);
  let written;
  const revalidated = await loadHolidays({
    now,
    read: async () => cache(),
    write: async (c) => {
      written = c;
    },
    fetcher: async (_, options) => {
      assert.equal(options.headers["If-None-Match"], '"v1"');
      return new Response(null, { status: 304 });
    },
  });
  assert.equal(revalidated.updatedAt, now);
  assert.equal(written.retryAt, 0);
  assert.deepEqual(revalidated.holidays["2025-05-05"], [
    "어린이날",
    "부처님 오신 날",
  ]);
});
test("new snapshot adds temporary holidays and removes withdrawn dates", async () => {
  const changed = fixture();
  delete changed["2025"]["2025-01-27"];
  changed["2025"]["2025-06-03"] = ["임시공휴일(대통령선거)"];
  let written;
  const result = await loadHolidays({
    now,
    read: async () => cache(),
    write: async (c) => {
      written = c;
    },
    fetcher: async () => Response.json(changed, { headers: { ETag: '"v2"' } }),
  });
  assert.equal(result.holidays["2025-01-27"], undefined);
  assert.equal(result.holidays["2025-06-03"][0], "임시공휴일(대통령선거)");
  assert.equal(written.etag, '"v2"');
});
test("failed refresh keeps last data, records retry window and reports stale", async () => {
  let written;
  const result = await loadHolidays({
    now,
    read: async () => cache(),
    write: async (c) => {
      written = c;
    },
    fetcher: async () => {
      throw new Error("offline");
    },
  });
  assert.equal(result.stale, true);
  assert.equal(result.updatedAt, 1);
  assert.equal(written.retryAt, now + HOLIDAY_RETRY);
  assert.equal(result.holidays["2025-01-27"][0], "임시공휴일");
  const retry = await loadHolidays({
    now: now + 1000,
    read: async () => written,
    write: async () => assert.fail(),
    fetcher: async () => assert.fail(),
  });
  assert.equal(retry.stale, true);
});
test("invalid upstream preserves cache; no cache raises unavailable", async () => {
  const result = await loadHolidays({
    now,
    read: async () => cache(),
    write: async () => {},
    fetcher: async () => Response.json({}),
  });
  assert.equal(result.stale, true);
  assert.equal(result.holidays["2025-01-27"][0], "임시공휴일");
  await assert.rejects(
    loadHolidays({
      now,
      read: async () => null,
      write: async () => {},
      fetcher: async () => Response.json({}),
    }),
  );
});
