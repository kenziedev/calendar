import { env } from "cloudflare:workers";
import {
  handle,
  body,
  database,
  hash,
  requireSession,
  HttpError,
} from "../../../lib/server";
export const dynamic = "force-dynamic";
export async function OPTIONS(request: Request) {
  return handle(request, async () => ({}));
}
export async function POST(request: Request) {
  return handle(request, async () => {
    const pin = (env as unknown as { APP_PIN?: string }).APP_PIN;
    if (!pin) throw new Error("APP_PIN is not configured");
    const input = await body(request);
    const now = Date.now(),
      key = await hash(request.headers.get("cf-connecting-ip") || "local");
    const db = database();
    const attempt = await db
      .prepare(
        "INSERT INTO login_attempts (key, count, expiresAt) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = CASE WHEN expiresAt <= ? THEN 1 ELSE count + 1 END, expiresAt = CASE WHEN expiresAt <= ? THEN ? ELSE expiresAt END RETURNING count",
      )
      .bind(key, now + 900000, now, now, now + 900000)
      .first<{ count: number }>();
    if (!attempt || attempt.count > 10)
      throw new HttpError(
        429,
        "입력을 여러 번 시도했어요. 15분 후 다시 열어 주세요.",
      );
    if (
      typeof input.pin !== "string" ||
      !/^\d{4}$/.test(input.pin) ||
      (await hash(input.pin)) !== (await hash(pin))
    )
      throw new HttpError(401, "비밀번호가 맞지 않아요. 다시 입력해 주세요.");
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
    const expiresAt = now + 30 * 86400000;
    await db.batch([
      db
        .prepare("INSERT INTO sessions (tokenHash, expiresAt) VALUES (?, ?)")
        .bind(await hash(token), expiresAt),
      db
        .prepare("DELETE FROM login_attempts WHERE key = ? OR expiresAt <= ?")
        .bind(key, now),
      db.prepare("DELETE FROM sessions WHERE expiresAt <= ?").bind(now),
    ]);
    return { token, expiresAt };
  });
}
export async function DELETE(request: Request) {
  return handle(request, async () => {
    const tokenHash = await requireSession(request);
    await database()
      .prepare("DELETE FROM sessions WHERE tokenHash = ?")
      .bind(tokenHash)
      .run();
    return { ok: true };
  });
}
