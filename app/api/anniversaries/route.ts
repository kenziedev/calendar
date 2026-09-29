import { z } from "zod";
import {
  body,
  calendarDateSchema,
  database,
  handle,
  HttpError,
  identitySchema,
  requireSession,
} from "../../../lib/server";
export const dynamic = "force-dynamic";
const schema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "기념일 이름을 입력해 주세요.")
      .max(60, "이름은 60자까지 입력할 수 있어요."),
    owner: z.enum(["hyun", "jeong", "together"]),
    kind: z.enum(["birthday", "anniversary"]),
    startDate: calendarDateSchema,
    yearly: z.boolean(),
    each100: z.boolean(),
    countFromOne: z.boolean(),
  })
  .refine(
    (v) => v.kind === "birthday" || v.yearly || v.each100,
    "주년 또는 100일 표시를 하나 이상 선택해 주세요.",
  )
  .transform((v) =>
    v.kind === "birthday"
      ? { ...v, yearly: true, each100: false, countFromOne: true }
      : v,
  );
const columns =
  "id, title, owner, kind, startDate, yearly, each100, countFromOne, version";
const toAnniversary = (row: Record<string, unknown>) => ({
  ...row,
  yearly: !!row.yearly,
  each100: !!row.each100,
  countFromOne: !!row.countFromOne,
});
const conflict = () =>
  new HttpError(
    409,
    "상대가 이 기념일을 변경했어요. 목록으로 돌아가 최신 내용을 다시 열어 주세요.",
  );
export async function OPTIONS(request: Request) {
  return handle(request, async () => ({}));
}
export async function GET(request: Request) {
  return handle(request, async () => {
    await requireSession(request);
    const result = await database()
      .prepare(
        `SELECT ${columns} FROM anniversaries WHERE deleted = 0 ORDER BY startDate, title`,
      )
      .all();
    return { anniversaries: result.results.map(toAnniversary) };
  });
}
export async function POST(request: Request) {
  return handle(request, async () => {
    await requireSession(request);
    const input = await body(request),
      a = schema.parse(input);
    const id = z.object({ createId: z.string().uuid() }).parse(input).createId,
      now = Date.now();
    await database()
      .prepare(
        "INSERT INTO anniversaries (id, title, owner, kind, startDate, yearly, each100, countFromOne, version, deleted, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?) ON CONFLICT(id) DO NOTHING",
      )
      .bind(
        id,
        a.title,
        a.owner,
        a.kind,
        a.startDate,
        Number(a.yearly),
        Number(a.each100),
        Number(a.countFromOne),
        now,
        now,
      )
      .run();
    const row = await database()
      .prepare(
        `SELECT ${columns} FROM anniversaries WHERE id = ? AND deleted = 0`,
      )
      .bind(id)
      .first<Record<string, unknown>>();
    if (!row) throw conflict();
    const saved = toAnniversary(row) as Record<string, unknown>;
    if (Object.entries(a).some(([key, value]) => saved[key] !== value)) {
      throw new HttpError(
        409,
        "이 기념일은 이미 저장됐어요. 목록으로 돌아가 저장된 내용을 열어 수정해 주세요.",
      );
    }
    return { anniversary: saved };
  });
}
export async function PATCH(request: Request) {
  return handle(request, async () => {
    await requireSession(request);
    const input = await body(request),
      a = schema.parse(input),
      { id, version } = identitySchema.parse(input);
    const row = await database()
      .prepare(
        `UPDATE anniversaries SET title = ?, owner = ?, kind = ?, startDate = ?, yearly = ?, each100 = ?, countFromOne = ?, version = version + 1, updatedAt = ? WHERE id = ? AND version = ? AND deleted = 0 RETURNING ${columns}`,
      )
      .bind(
        a.title,
        a.owner,
        a.kind,
        a.startDate,
        Number(a.yearly),
        Number(a.each100),
        Number(a.countFromOne),
        Date.now(),
        id,
        version,
      )
      .first<Record<string, unknown>>();
    if (!row) throw conflict();
    return { anniversary: toAnniversary(row) };
  });
}
export async function DELETE(request: Request) {
  return handle(request, async () => {
    await requireSession(request);
    const { id, version } = identitySchema.parse(await body(request));
    const result = await database()
      .prepare(
        "UPDATE anniversaries SET deleted = 1, version = version + 1, updatedAt = ? WHERE id = ? AND version = ? AND deleted = 0",
      )
      .bind(Date.now(), id, version)
      .run();
    if (!result.meta.changes) throw conflict();
    return { ok: true };
  });
}
