import assert from "node:assert/strict";
const base = "http://localhost:5173";
let token, event;
async function call(path, method = "GET", body) {
  const response = await fetch(`${base}/api/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, data: await response.json() };
}
const point = { latitude: 37.5760259, longitude: 126.9768428 };
try {
  const login = await call("session", "POST", { pin: process.env.APP_PIN });
  assert.equal(login.status, 200);
  token = login.data.token;
  const draft = {
    createId: crypto.randomUUID(),
    title: "[자동 검증] 지도 좌표",
    owner: "hyun",
    startDate: "2099-09-28",
    endDate: "2099-09-28",
    startTime: "09:00",
    endTime: "10:00",
    allDay: true,
    repeat: "none",
    repeatUntil: "",
    notes: "검증 후 정리",
    location: "광화문 · 서울특별시 종로구",
    locationPoint: point,
  };
  for (const fields of [
    { locationPoint: { latitude: 200, longitude: 127 } },
    { locationPoint: { latitude: 37 } },
    { locationPoint: { latitude: 0, longitude: 0 } },
    { location: "" },
  ])
    assert.equal(
      (await call("events", "POST", { ...draft, ...fields })).status,
      400,
    );
  const created = await call("events", "POST", draft);
  assert.equal(created.status, 200);
  event = created.data.event;
  assert.deepEqual(event.locationPoint, point);
  const list = await call("events");
  assert.deepEqual(
    list.data.events.find((e) => e.id === event.id).locationPoint,
    point,
  );
  const patch = async (fields, omitPoint = false) => {
    const input = { ...event, ...fields };
    if (omitPoint) delete input.locationPoint;
    const result = await call("events", "PATCH", input);
    assert.equal(result.status, 200);
    event = result.data.event;
  };
  await patch({ notes: "구버전 앱 편집" }, true);
  assert.deepEqual(event.locationPoint, point);
  await patch({ location: "서울역" }, true);
  assert.equal(event.locationPoint, null);
  await patch({ location: draft.location, locationPoint: point });
  assert.deepEqual(event.locationPoint, point);
  await patch({ locationPoint: null });
  assert.equal(event.locationPoint, null);
  console.log(
    "PASS: coordinate validation, saved/reloaded coordinates, legacy-client preservation and clearing, explicit clearing",
  );
} finally {
  if (event)
    assert.equal(
      (await call("events", "DELETE", { id: event.id, version: event.version }))
        .status,
      200,
    );
  if (token) await call("session", "DELETE");
}
