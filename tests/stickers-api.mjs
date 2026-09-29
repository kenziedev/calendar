import assert from "node:assert/strict";
const base = process.argv[2] || "http://localhost:5173";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname)) {
  throw new Error("Run sticker write tests only against a local database.");
}
const date = "2099-12-28";
const sessions = [];
let owned = false;
async function call(
  method,
  body,
  token,
  path = "stickers",
  origin = new URL(base).origin,
) {
  const response = await fetch(`${base}/api/${path}`, {
    method,
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return {
    status: response.status,
    headers: response.headers,
    data: await response.json().catch(() => null),
  };
}
try {
  assert.equal((await call("GET")).status, 401);
  assert.equal((await call("POST", {})).status, 401);
  assert.equal((await call("OPTIONS")).status, 204);
  assert.equal(
    (await call("OPTIONS", null, null, "stickers", "https://untrusted.example"))
      .status,
    403,
  );
  for (let i = 0; i < 2; i++) {
    const login = await call(
      "POST",
      { pin: process.env.APP_PIN },
      null,
      "session",
    );
    assert.equal(login.status, 200);
    sessions.push(login.data.token);
  }
  const [a, b] = sessions;
  const initial = await call("GET", null, a);
  assert.equal(initial.status, 200);
  assert.equal(initial.headers.get("cache-control"), "no-store, private");
  const old = initial.data.stickers.find((s) => s.date === date);
  assert.ok(
    !old?.stickerId,
    "Refuse to overwrite an existing sticker on the test date.",
  );
  for (const input of [
    { date: "2026-02-30", stickerId: "frog", version: 0 },
    { date, stickerId: "<script>", version: 0 },
    { date, stickerId: "frog", version: -1 },
    { date, stickerId: "frog", version: 0, owner: "hyun" },
  ])
    assert.equal((await call("POST", input, a)).status, 400);
  const created = await call(
    "POST",
    { date, stickerId: "frog", version: old?.version ?? 0 },
    a,
  );
  assert.equal(created.status, 200);
  owned = true;
  const version = created.data.sticker.version;
  assert.equal(
    (await call("GET", null, b)).data.stickers.find((s) => s.date === date)
      .stickerId,
    "frog",
  );
  const race = await Promise.all([
    call("POST", { date, stickerId: "bear", version }, a),
    call("POST", { date, stickerId: "heart", version }, b),
  ]);
  assert.deepEqual(race.map((r) => r.status).sort(), [200, 409]);
  const winner = race.find((r) => r.status === 200).data.sticker;
  assert.equal(winner.version, version + 1);
  const cleared = await call(
    "POST",
    { date, stickerId: null, version: winner.version },
    b,
  );
  assert.equal(cleared.status, 200);
  assert.equal(cleared.data.sticker.stickerId, null);
  assert.equal(cleared.data.sticker.version, winner.version + 1);
  assert.equal(
    (await call("POST", { date, stickerId: "cake", version: 0 }, a)).status,
    409,
  );
  assert.equal(
    (
      await call(
        "POST",
        { date, stickerId: "cake", version: winner.version },
        a,
      )
    ).status,
    409,
  );
  const replaced = await call(
    "POST",
    { date, stickerId: "airplane", version: cleared.data.sticker.version },
    a,
  );
  assert.equal(replaced.status, 200);
  assert.deepEqual(
    (await call("GET", null, b)).data.stickers.find((s) => s.date === date),
    replaced.data.sticker,
  );
  console.log(
    "PASS: sticker auth/CORS, date and ID validation, shared persistence, concurrent writes, tombstone conflict, replacement.",
  );
} finally {
  if (owned && sessions[0]) {
    const latest = (await call("GET", null, sessions[0])).data?.stickers.find(
      (s) => s.date === date,
    );
    if (latest?.stickerId)
      assert.equal(
        (
          await call(
            "POST",
            { date, stickerId: null, version: latest.version },
            sessions[0],
          )
        ).status,
        200,
      );
  }
  for (const token of sessions) await call("DELETE", null, token, "session");
}
