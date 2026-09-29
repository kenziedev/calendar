import { z } from "zod";
import {
  handle,
  body,
  database,
  requireSession,
  calendarDateSchema,
  HttpError,
} from "../../../lib/server";
import { STICKERS, type StickerId } from "../../../lib/stickers";

export const dynamic = "force-dynamic";
const schema = z
  .object({
    date: calendarDateSchema,
    stickerId: z
      .enum(STICKERS.map((s) => s.id) as [StickerId, ...StickerId[]])
      .nullable(),
    version: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  })
  .strict();
const columns = "date, stickerId, version";

export async function OPTIONS(request: Request) {
  return handle(request, async () => ({}));
}
export async function GET(request: Request) {
  return handle(request, async () => {
    await requireSession(request);
    const result = await database()
      .prepare(`SELECT ${columns} FROM day_stickers ORDER BY date`)
      .all();
    return { stickers: result.results };
  });
}
export async function POST(request: Request) {
  return handle(request, async () => {
    await requireSession(request);
    const { date, stickerId, version } = schema.parse(await body(request));
    // Cleared stickers keep their version so stale clients cannot recreate them.
    const row =
      version === 0
        ? await database()
            .prepare(
              `INSERT INTO day_stickers (date, stickerId, version, updatedAt) VALUES (?, ?, 1, ?) ON CONFLICT(date) DO NOTHING RETURNING ${columns}`,
            )
            .bind(date, stickerId, Date.now())
            .first()
        : await database()
            .prepare(
              `UPDATE day_stickers SET stickerId = ?, version = version + 1, updatedAt = ? WHERE date = ? AND version = ? RETURNING ${columns}`,
            )
            .bind(stickerId, Date.now(), date, version)
            .first();
    if (!row)
      throw new HttpError(
        409,
        "이 날짜의 스티커가 변경됐어요. 새로 반영된 스티커를 확인하고 다시 붙여 주세요.",
      );
    return { sticker: row };
  });
}
