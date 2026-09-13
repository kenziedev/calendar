import assert from "node:assert/strict";
const base = process.argv[2] || "http://localhost:5173";
const allowedOrigin =
  base.startsWith("http://localhost") || base.startsWith("http://127.0.0.1")
    ? new URL(base).origin
    : "https://kenzie.kr";
const pin = process.env.APP_PIN;
if (!pin) throw new Error("Set APP_PIN for the test.");
let a, b, created;
async function call(path, method = "GET", body, token, origin = allowedOrigin) {
  const r = await fetch(base + "/api/" + path, {
    method,
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await r.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }
  return { status: r.status, headers: r.headers, data };
}
try {
  assert.equal((await call("events")).status, 401);
  assert.equal((await call("events", "POST", {})).status, 401);
  assert.equal((await call("events", "OPTIONS")).status, 204);
  assert.equal(
    (
      await call(
        "events",
        "OPTIONS",
        undefined,
        undefined,
        "https://untrusted.example",
      )
    ).status,
    403,
  );
  assert.equal((await call("session", "POST", { pin: "0000" })).status, 401);
  const loginA = await call("session", "POST", { pin });
  assert.equal(loginA.status, 200);
  a = loginA.data.token;
  const loginB = await call("session", "POST", { pin });
  assert.equal(loginB.status, 200);
  b = loginB.data.token;
  assert.notEqual(a, b);
  const draft = {
    createId: crypto.randomUUID(),
    title: "[자동 검증] 공유 일정",
    owner: "together",
    startDate: "2099-09-13",
    endDate: "2099-09-14",
    startTime: "09:00",
    endTime: "10:00",
    allDay: true,
    repeat: "weekly",
    repeatUntil: "2099-09-30",
    location: "검증용",
    notes: "자동 검증 후 삭제",
  };
  assert.equal(
    (await call("events", "POST", { ...draft, startDate: "2099-02-31" }, a))
      .status,
    400,
  );
  assert.equal(
    (await call("events", "POST", { ...draft, title: "   " }, a)).status,
    400,
  );
  const first = await call("events", "POST", draft, a);
  assert.equal(first.status, 200);
  created = first.data.event;
  const retry = await call("events", "POST", draft, a);
  assert.equal(retry.data.event.id, created.id);
  const listB = await call("events", "GET", undefined, b);
  assert.equal(listB.status, 200);
  assert.equal(listB.data.events.filter((e) => e.id === created.id).length, 1);
  assert.equal(listB.headers.get("access-control-allow-origin"), allowedOrigin);
  assert.match(listB.headers.get("cache-control"), /no-store/);
  const update = await call(
    "events",
    "PATCH",
    { ...created, title: "[자동 검증] 수정 완료" },
    b,
  );
  assert.equal(update.status, 200);
  assert.equal(update.data.event.version, created.version + 1);
  assert.equal(
    (await call("events", "PATCH", { ...created, title: "오래된 수정" }, a))
      .status,
    409,
  );
  assert.equal(
    (
      await call(
        "events",
        "DELETE",
        { id: created.id, version: created.version },
        a,
      )
    ).status,
    409,
  );
  created = update.data.event;
  assert.equal(
    (
      await call(
        "events",
        "DELETE",
        { id: created.id, version: created.version },
        a,
      )
    ).status,
    200,
  );
  created = null;
  assert.equal((await call("session", "DELETE", undefined, a)).status, 200);
  assert.equal((await call("events", "GET", undefined, a)).status, 401);
  a = null;
  assert.equal((await call("events", "GET", undefined, b)).status, 200);
  console.log(
    "PASS: auth, CORS, validation, shared persistence, idempotent create, version conflicts, deletion, logout isolation",
  );
} finally {
  if (created && (a || b))
    await call(
      "events",
      "DELETE",
      { id: created.id, version: created.version },
      a || b,
    );
  if (a) await call("session", "DELETE", undefined, a);
  if (b) await call("session", "DELETE", undefined, b);
}
