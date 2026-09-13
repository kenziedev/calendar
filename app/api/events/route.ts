import {
  handle,
  body,
  database,
  requireSession,
  eventSchema,
  identitySchema,
  HttpError,
} from "../../../lib/server";
import { z } from "zod";
export const dynamic = "force-dynamic";
const columns =
  "id, title, owner, startDate, endDate, startTime, endTime, allDay, repeat, repeatUntil, location, notes, version";
const toEvent = (row: Record<string, unknown>) => ({
  ...row,
  allDay: !!row.allDay,
});
export async function OPTIONS(request: Request) {
  return handle(request, async () => ({}));
}
export async function GET(request: Request) {
  return handle(request, async () => {
    await requireSession(request);
    const result = await database()
      .prepare(`SELECT ${columns} FROM events ORDER BY startDate, startTime`)
      .all();
    return { events: result.results.map(toEvent) };
  });
}
export async function POST(request: Request) {
  return handle(request, async () => {
    await requireSession(request);
    const input = await body(request),
      e = eventSchema.parse(input),
      id = z.object({ createId: z.string().uuid() }).parse(input).createId,
      now = Date.now();
    await database()
      .prepare(
        "INSERT INTO events (id, title, owner, startDate, endDate, startTime, endTime, allDay, repeat, repeatUntil, location, notes, version, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?) ON CONFLICT(id) DO NOTHING",
      )
      .bind(
        id,
        e.title,
        e.owner,
        e.startDate,
        e.endDate,
        e.startTime,
        e.endTime,
        Number(e.allDay),
        e.repeat,
        e.repeat === "none" ? "" : e.repeatUntil,
        e.location,
        e.notes,
        now,
        now,
      )
      .run();
    const row = await database()
      .prepare(`SELECT ${columns} FROM events WHERE id = ?`)
      .bind(id)
      .first<Record<string, unknown>>();
    if (!row) throw new Error("Created event unavailable");
    return { event: toEvent(row) };
  });
}
export async function PATCH(request: Request) {
  return handle(request, async () => {
    await requireSession(request);
    const input = await body(request),
      e = eventSchema.parse(input),
      { id, version } = identitySchema.parse(input);
    const row = await database()
      .prepare(
        `UPDATE events SET title = ?, owner = ?, startDate = ?, endDate = ?, startTime = ?, endTime = ?, allDay = ?, repeat = ?, repeatUntil = ?, location = ?, notes = ?, version = version + 1, updatedAt = ? WHERE id = ? AND version = ? RETURNING ${columns}`,
      )
      .bind(
        e.title,
        e.owner,
        e.startDate,
        e.endDate,
        e.startTime,
        e.endTime,
        Number(e.allDay),
        e.repeat,
        e.repeat === "none" ? "" : e.repeatUntil,
        e.location,
        e.notes,
        Date.now(),
        id,
        version,
      )
      .first<Record<string, unknown>>();
    if (!row)
      throw new HttpError(
        409,
        "상대가 이 일정을 변경했어요. 입력 내용을 확인한 뒤 창을 닫고 일정을 다시 열어 주세요.",
      );
    return { event: toEvent(row) };
  });
}
export async function DELETE(request: Request) {
  return handle(request, async () => {
    await requireSession(request);
    const { id, version } = identitySchema.parse(await body(request));
    const result = await database()
      .prepare("DELETE FROM events WHERE id = ? AND version = ?")
      .bind(id, version)
      .run();
    if (!result.meta.changes)
      throw new HttpError(
        409,
        "상대가 이 일정을 변경했어요. 창을 닫고 최신 일정을 다시 확인해 주세요.",
      );
    return { ok: true };
  });
}
