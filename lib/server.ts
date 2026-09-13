import { env } from "cloudflare:workers";
import { z } from "zod";
import { dateNumber } from "./calendar";
export function database() {
  if (!env.DB) throw new Error("Calendar DB binding unavailable");
  return env.DB;
}
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
const ORIGINS = new Set([
  "https://kenzie.kr",
  "https://kenziedev.github.io",
  "https://kenzie-our-calendar.balmy-cod-8181.chatgpt.site",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:8787",
]);
export function cors(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && !ORIGINS.has(origin))
    throw new HttpError(403, "허용되지 않은 접근이에요.");
  return {
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
    "Cache-Control": "no-store, private",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  };
}
export async function handle(request: Request, action: () => Promise<unknown>) {
  let headers: Record<string, string> = { "Cache-Control": "no-store" };
  try {
    headers = cors(request);
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers });
    return Response.json(await action(), { headers });
  } catch (e) {
    if (e instanceof HttpError)
      return Response.json({ error: e.message }, { status: e.status, headers });
    if (e instanceof z.ZodError)
      return Response.json(
        { error: e.issues[0]?.message || "입력 내용을 확인해 주세요." },
        { status: 400, headers },
      );
    console.error(
      "Calendar request failed",
      e instanceof Error ? e.message : "Unknown failure",
    );
    return Response.json(
      {
        error:
          "일정을 불러오거나 저장하지 못했어요. 연결을 확인하고 다시 시도해 주세요.",
      },
      { status: 503, headers },
    );
  }
}
export async function body(request: Request) {
  const text = await request.text();
  if (text.length > 12000) throw new HttpError(413, "입력 내용이 너무 길어요.");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "입력 내용을 확인해 주세요.");
  }
}
export async function hash(value: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
}
export async function requireSession(request: Request) {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token)
    throw new HttpError(401, "비밀번호를 입력하고 달력을 열어 주세요.");
  const tokenHash = await hash(token);
  const row = await database()
    .prepare(
      "SELECT tokenHash FROM sessions WHERE tokenHash = ? AND expiresAt > ?",
    )
    .bind(tokenHash, Date.now())
    .first();
  if (!row)
    throw new HttpError(
      401,
      "세션이 만료됐어요. 비밀번호를 다시 입력해 주세요.",
    );
  return tokenHash;
}
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜를 입력해 주세요.")
  .refine(
    (value) =>
      value >= "1900-01-01" &&
      value <= "2100-12-31" &&
      Number.isFinite(dateNumber(value)) &&
      new Date(dateNumber(value)).toISOString().slice(0, 10) === value,
    "올바른 날짜를 입력해 주세요.",
  );
const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "올바른 시간을 입력해 주세요.");
export const eventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "일정 제목을 입력해 주세요.")
      .max(100, "제목은 100자까지 입력할 수 있어요."),
    owner: z.enum(["hyun", "jeong", "together"]),
    startDate: date,
    endDate: date,
    startTime: time,
    endTime: time,
    allDay: z.boolean(),
    repeat: z.enum(["none", "daily", "weekly", "monthly", "yearly"]),
    repeatUntil: z.union([z.literal(""), date]),
    location: z.string().trim().max(200),
    notes: z.string().trim().max(3000),
  })
  .superRefine((e, ctx) => {
    if (
      e.endDate < e.startDate ||
      (!e.allDay && e.endDate === e.startDate && e.endTime <= e.startTime)
    )
      ctx.addIssue({
        code: "custom",
        message: "종료는 시작보다 뒤여야 해요.",
        path: ["endDate"],
      });
    if ((dateNumber(e.endDate) - dateNumber(e.startDate)) / 86400000 > 366)
      ctx.addIssue({
        code: "custom",
        message: "한 일정의 기간은 최대 1년이에요.",
        path: ["endDate"],
      });
    if (e.repeat !== "none" && e.repeatUntil && e.repeatUntil < e.startDate)
      ctx.addIssue({
        code: "custom",
        message: "반복 종료일은 시작일 이후로 선택해 주세요.",
        path: ["repeatUntil"],
      });
  });
export const identitySchema = z.object({
  id: z.string().uuid(),
  version: z.number().int().positive(),
});
