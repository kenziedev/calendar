import test from "node:test";
import assert from "node:assert/strict";
import { normalizePlaces, searchNaverPlaces } from "../lib/places.ts";
import { naverMapUrl } from "../lib/maps.ts";
import { naverMapPoint, validMapPoint } from "../lib/coordinates.ts";

test("Naver coordinates accept current scaled WGS84 and decimal WGS84, reject absent or legacy values", () => {
  const point = { longitude: 126.9768428, latitude: 37.5760259 };
  assert.deepEqual(naverMapPoint("1269768428", "375760259"), point);
  assert.deepEqual(naverMapPoint("126.9768428", "37.5760259"), point);
  for (const [x, y] of [
    ["", ""],
    [undefined, undefined],
    ["NaN", "37"],
    ["Infinity", "37"],
    ["311277", "552097"],
    ["0", "0"],
    ["1900000000", "375760259"],
    [true, 37],
  ])
    assert.equal(naverMapPoint(x, y), null);
  assert.equal(validMapPoint({ latitude: "37", longitude: 127 }), false);
  const [place] = normalizePlaces({
    items: [
      {
        title: "광화문",
        roadAddress: "서울특별시 종로구",
        mapx: "1269768428",
        mapy: "375760259",
      },
    ],
  });
  assert.deepEqual(place.point, point);
});

test("saved place selections open Maps using the place name, excluding display address", () => {
  const [place] = normalizePlaces({
    items: [
      {
        title: "광화문",
        roadAddress: "서울특별시 종로구 효자로 12 국립고궁박물관",
      },
    ],
  });
  assert.equal(
    naverMapUrl(place.location),
    "https://map.naver.com/p/search/" + encodeURIComponent("광화문"),
  );
  for (const address of [
    "서울 종로구 사직로 161",
    "경기도 고양시 일산동구 중앙로 1 2층",
    "강원특별자치도 춘천시 중앙로 1",
    "전북특별자치도 전주시 완산구 중앙동 1",
    "제주특별자치도 제주시 중앙로 1",
  ]) {
    assert.equal(
      naverMapUrl(`카페 · 바 & 쉼 · ${address}`),
      "https://map.naver.com/p/search/" + encodeURIComponent("카페 · 바 & 쉼"),
    );
  }
});

test("Maps preserves manual names, addresses and trusted share links", () => {
  assert.equal(naverMapUrl("  "), null);
  for (const query of [
    "광화문",
    "서울특별시 종로구 사직로 161",
    "카페 · 2층",
    "약속 · 서울역 근처",
    "https://example.com/?q=서울",
  ]) {
    assert.equal(
      naverMapUrl(query),
      "https://map.naver.com/p/search/" + encodeURIComponent(query),
    );
  }
  for (const link of [
    "https://naver.me/example",
    "https://map.naver.com/p/search/광화문",
    "https://m.map.naver.com/search2/search.naver?query=서울역",
  ]) {
    assert.equal(naverMapUrl(link), new URL(link).href);
  }
});

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
