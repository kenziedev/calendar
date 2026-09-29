import assert from "node:assert/strict";
const base = process.argv[2] || "http://localhost:5173";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw Error("Only run write tests against a local database.");
const sessions = [],
  created = [];
async function call(path, method = "GET", body, token) {
  const response = await fetch(`${base}/api/${path}`, {
    method,
    headers: {
      Origin: new URL(base).origin,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return {
    status: response.status,
    data: await response.json().catch(() => null),
  };
}
const draft = {
  createId: crypto.randomUUID(),
  title: "기념일 검증",
  owner: "together",
  kind: "anniversary",
  startDate: "2026-09-29",
  yearly: true,
  each100: true,
  countFromOne: true,
};
try {
  assert.equal((await call("anniversaries")).status, 401);
  assert.equal((await call("anniversaries", "POST", draft)).status, 401);
  assert.equal((await call("anniversaries", "OPTIONS")).status, 204);
  for (let i = 0; i < 2; i++) {
    const r = await call("session", "POST", { pin: process.env.APP_PIN });
    assert.equal(r.status, 200);
    sessions.push(r.data.token);
  }
  const [a, b] = sessions;
  for (const patch of [
    { startDate: "2026-02-30" },
    { yearly: false, each100: false },
    { title: " " },
    { owner: "invalid" },
    { each100: "true" },
  ])
    assert.equal(
      (await call("anniversaries", "POST", { ...draft, ...patch }, a)).status,
      400,
    );
  const first = await call("anniversaries", "POST", draft, a);
  assert.equal(first.status, 200);
  created.push(first.data.anniversary.id);
  assert.equal(first.data.anniversary.version, 1);
  assert.equal(
    (await call("anniversaries", "POST", draft, a)).data.anniversary.id,
    created[0],
  );
  assert.equal(
    (
      await call(
        "anniversaries",
        "POST",
        { ...draft, title: "응답 유실 후 바꾼 제목" },
        a,
      )
    ).status,
    409,
  );
  assert.equal(
    (await call("anniversaries", "GET", null, b)).data.anniversaries.filter(
      (r) => r.id === created[0],
    ).length,
    1,
  );
  const old = first.data.anniversary;
  const race = await Promise.all([
    call("anniversaries", "PATCH", { ...old, title: "수정 A" }, a),
    call("anniversaries", "PATCH", { ...old, title: "수정 B" }, b),
  ]);
  assert.deepEqual(race.map((r) => r.status).sort(), [200, 409]);
  const saved = race.find((r) => r.status === 200).data.anniversary;
  assert.equal(saved.version, 2);
  assert.equal(
    (await call("anniversaries", "DELETE", { id: saved.id, version: 1 }, a))
      .status,
    409,
  );
  const birthday = await call(
    "anniversaries",
    "POST",
    {
      ...draft,
      createId: crypto.randomUUID(),
      title: "생일 검증",
      kind: "birthday",
      yearly: false,
      each100: true,
      countFromOne: false,
      startDate: "2000-02-29",
    },
    a,
  );
  assert.equal(birthday.status, 200);
  created.push(birthday.data.anniversary.id);
  assert.equal(birthday.data.anniversary.yearly, true);
  assert.equal(birthday.data.anniversary.each100, false);
  assert.equal(
    (
      await call(
        "anniversaries",
        "DELETE",
        { id: saved.id, version: saved.version },
        a,
      )
    ).status,
    200,
  );
  assert.equal((await call("anniversaries", "PATCH", saved, b)).status, 409);
  assert.equal((await call("anniversaries", "POST", draft, a)).status, 409);
  assert.equal(
    (await call("anniversaries", "GET", null, b)).data.anniversaries.some(
      (r) => r.id === saved.id,
    ),
    false,
  );
  const all = await call("stickers", "GET", null, a),
    date = "2099-12-29";
  let oldSticker = all.data.stickers.find((s) => s.date === date);
  assert.ok(
    !oldSticker?.stickerId,
    "Don't overwrite preexisting test-date stickers.",
  );
  for (const stickerId of [
    "pikachu",
    "charmander",
    "squirtle",
    "kirby",
    null,
  ]) {
    const r = await call(
      "stickers",
      "POST",
      { date, stickerId, version: oldSticker?.version ?? 0 },
      a,
    );
    assert.equal(r.status, 200);
    oldSticker = r.data.sticker;
  }
  console.log(
    "PASS: anniversary auth, validation, create retry, shared read, concurrent update, birthday normalization, stale delete, tombstone protection, four character IDs.",
  );
} finally {
  if (sessions[0]) {
    const data = await call("anniversaries", "GET", null, sessions[0]);
    for (const a of data.data?.anniversaries ?? [])
      if (created.includes(a.id))
        await call(
          "anniversaries",
          "DELETE",
          { id: a.id, version: a.version },
          sessions[0],
        );
  }
  for (const token of sessions) await call("session", "DELETE", null, token);
}
