export const HOLIDAY_SOURCE = "https://holidays.hyunbin.page";
export const HOLIDAY_FEED = `${HOLIDAY_SOURCE}/basic.json`;
export const HOLIDAY_TTL = 6 * 60 * 60 * 1000;
export const HOLIDAY_RETRY = 15 * 60 * 1000;

export type HolidayCalendar = {
  holidays: Record<string, string[]>;
  years: number[];
  updatedAt: number;
  stale: boolean;
  source: string;
};
export type HolidayCache = {
  payload: string;
  etag: string;
  updatedAt: number;
  retryAt: number;
};

// Keep the provider's complete snapshot: holidays can be added or withdrawn.
export function parseHolidays(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("Invalid holiday feed");
  const holidays: Record<string, string[]> = {};
  const years: number[] = [];
  for (const [year, dates] of Object.entries(input)) {
    if (
      !/^(19|20|21)\d{2}$/.test(year) ||
      !dates ||
      typeof dates !== "object" ||
      Array.isArray(dates)
    )
      throw new Error("Invalid holiday year");
    const entries = Object.entries(dates);
    if (entries.length < 10) throw new Error("Incomplete holiday year");
    for (const [date, names] of entries) {
      const timestamp = Date.parse(`${date}T00:00:00Z`);
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !date.startsWith(`${year}-`) ||
        !Number.isFinite(timestamp) ||
        new Date(timestamp).toISOString().slice(0, 10) !== date ||
        !Array.isArray(names) ||
        !names.length ||
        names.some(
          (name) =>
            typeof name !== "string" || !name.trim() || name.length > 150,
        )
      )
        throw new Error("Invalid holiday date or name");
      holidays[date] = [...new Set(names.map((name) => name.trim()))];
    }
    years.push(Number(year));
  }
  if (!years.length) throw new Error("Empty holiday feed");
  return { holidays, years: years.sort((a, b) => a - b) };
}

export async function loadHolidays(deps: {
  read: () => Promise<HolidayCache | null>;
  write: (cache: HolidayCache) => Promise<void>;
  fetcher?: typeof fetch;
  now?: number;
}): Promise<HolidayCalendar> {
  const now = deps.now ?? Date.now();
  let cached = await deps.read();
  let parsed: ReturnType<typeof parseHolidays> | undefined;
  if (cached) {
    try {
      parsed = parseHolidays(JSON.parse(cached.payload));
    } catch {
      cached = null;
    }
  }
  const snapshot = (stale: boolean): HolidayCalendar => ({
    ...parsed!,
    updatedAt: cached!.updatedAt,
    stale,
    source: HOLIDAY_SOURCE,
  });
  if (cached && now - cached.updatedAt < HOLIDAY_TTL) return snapshot(false);
  if (cached && now < cached.retryAt) return snapshot(true);
  try {
    const response = await (deps.fetcher ?? fetch)(HOLIDAY_FEED, {
      headers: cached?.etag ? { "If-None-Match": cached.etag } : {},
      signal: AbortSignal.timeout(8000),
    });
    if (response.status === 304 && cached) {
      cached = { ...cached, updatedAt: now, retryAt: 0 };
    } else {
      if (!response.ok)
        throw new Error(`Holiday feed returned ${response.status}`);
      const payload = await response.text();
      if (payload.length > 1_000_000) throw new Error("Holiday feed too large");
      const next = parseHolidays(JSON.parse(payload));
      // A truncated upstream response must not erase already supported years.
      if (parsed && parsed.years.some((year) => !next.years.includes(year)))
        throw new Error("Holiday feed lost a supported year");
      cached = {
        payload,
        etag: response.headers.get("etag") || "",
        updatedAt: now,
        retryAt: 0,
      };
      parsed = next;
    }
    await deps.write(cached);
    return snapshot(false);
  } catch (error) {
    if (!cached || !parsed) throw error;
    await deps
      .write({ ...cached, retryAt: now + HOLIDAY_RETRY })
      .catch(() => {});
    return snapshot(true);
  }
}
