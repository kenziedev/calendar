import {
  database,
  handle,
  HttpError,
  requireSession,
} from "../../../lib/server";
import { loadHolidays, type HolidayCache } from "../../../lib/holidays";

export async function GET(request: Request) {
  return handle(request, async () => {
    await requireSession(request);
    try {
      const holidayCalendar = await loadHolidays({
        read: () =>
          database()
            .prepare(
              "SELECT payload, etag, updatedAt, retryAt FROM holiday_cache WHERE id = 'kr'",
            )
            .first<HolidayCache>(),
        write: async (cache) => {
          await database()
            .prepare(
              "INSERT INTO holiday_cache (id, payload, etag, updatedAt, retryAt) VALUES ('kr', ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, etag = excluded.etag, updatedAt = excluded.updatedAt, retryAt = excluded.retryAt WHERE holiday_cache.updatedAt <= excluded.updatedAt",
            )
            .bind(cache.payload, cache.etag, cache.updatedAt, cache.retryAt)
            .run();
        },
      });
      return { holidayCalendar };
    } catch {
      throw new HttpError(
        503,
        "공휴일 자료를 불러오지 못했습니다. 잠시 후 새로고침해 주세요.",
      );
    }
  });
}
export const OPTIONS = GET;
