import test from "node:test";
import assert from "node:assert/strict";
import { normalizePlaces, searchNaverPlaces } from "../lib/places.ts";

test("place selection strips provider markup, prefers road address and stays within storage limit", () => {
  const places = normalizePlaces({
    items: [
      {
        title: "<b>서울</b> &amp; 역",
        roadAddress: "서울특별시 용산구 한강대로 405",
        address: "지번",
        category: "교통&gt;기차역",
      },
      { title: "긴".repeat(300), roadAddress: "주소".repeat(300) },
      { title: "광화문", address: "서울특별시 종로구 사직로 161" },
      { title: "주소 없는 결과" },
    ],
  });
  assert.equal(places.length, 3);
  assert.equal(places[0].name, "서울 & 역");
  assert.equal(places[0].category, "교통>기차역");
  assert.equal(
    places[0].location,
    "서울 & 역 · 서울특별시 용산구 한강대로 405",
  );
  assert.ok(places.every((place) => place.location.length <= 200));
  assert.equal(places[2].address, "서울특별시 종로구 사직로 161");
});
test("API HUB requests use the documented local search path, JSON format and server credentials", async () => {
  // Exercise the actual request contract with test-only credentials.
  await searchNaverPlaces(
    "광화문 & 서울",
    { id: "test-id", secret: "test-secret" },
    async (url, init) => {
      assert.equal(url.origin, "https://naverapihub.apigw.ntruss.com");
      assert.equal(url.pathname, "/search/v1/local");
      assert.equal(url.searchParams.get("query"), "광화문 & 서울");
      assert.equal(url.searchParams.get("display"), "5");
      assert.equal(url.searchParams.get("start"), "1");
      assert.equal(url.searchParams.get("format"), "json");
      assert.equal(init.headers["X-NCP-APIGW-API-KEY-ID"], "test-id");
      assert.equal(init.headers["X-NCP-APIGW-API-KEY"], "test-secret");
      assert.equal(init.headers["X-Naver-Client-Secret"], undefined);
      return Response.json({ items: [] });
    },
  );
});
test("provider errors and malformed responses are not reported as empty success", async () => {
  await assert.rejects(
    searchNaverPlaces(
      "서울역",
      { id: "test", secret: "test" },
      async () => new Response("private diagnostics", { status: 403 }),
    ),
    /Place search unavailable/,
  );
  assert.throws(() => normalizePlaces({ error: "invalid key" }));
});
