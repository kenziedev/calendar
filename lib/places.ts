import { naverMapPoint, type MapPoint } from "./coordinates.ts";

export type PlaceResult = {
  name: string;
  address: string;
  category: string;
  location: string;
  point: MapPoint | null;
};
export type PlaceSearch = { enabled: boolean; places: PlaceResult[] };

function plainText(value: unknown, limit: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/<[^>]*>/g, "")
    .replace(
      /&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,
      (match, entity: string) => {
        const named: Record<string, string> = {
          amp: "&",
          lt: "<",
          gt: ">",
          quot: '"',
          apos: "'",
          nbsp: " ",
        };
        const key = entity.toLowerCase();
        if (key in named) return named[key];
        const n = key.startsWith("#x")
          ? parseInt(key.slice(2), 16)
          : Number(key.slice(1));
        return n > 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff)
          ? String.fromCodePoint(n)
          : match;
      },
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

export function normalizePlaces(data: unknown): PlaceResult[] {
  if (
    !data ||
    typeof data !== "object" ||
    !Array.isArray((data as { items?: unknown }).items)
  )
    throw new Error("Invalid place search response");
  const unique = new Map<string, PlaceResult>();
  for (const item of (data as { items: Record<string, unknown>[] }).items.slice(
    0,
    5,
  )) {
    if (!item || typeof item !== "object") continue;
    const name = plainText(item.title, 80);
    const address = plainText(item.roadAddress || item.address, 115);
    if (!name || !address) continue;
    const location = `${name} · ${address}`;
    unique.set(location, {
      name,
      address,
      location,
      category: plainText(item.category, 100),
      point: naverMapPoint(item.mapx, item.mapy),
    });
  }
  return [...unique.values()];
}

export async function searchNaverPlaces(
  query: string,
  credentials: { id: string; secret: string },
  fetcher: typeof fetch = fetch,
) {
  const url = new URL("https://naverapihub.apigw.ntruss.com/search/v1/local");
  url.searchParams.set("query", query);
  url.searchParams.set("display", "5");
  url.searchParams.set("start", "1");
  url.searchParams.set("sort", "random");
  url.searchParams.set("format", "json");
  const response = await fetcher(url, {
    headers: {
      "X-NCP-APIGW-API-KEY-ID": credentials.id,
      "X-NCP-APIGW-API-KEY": credentials.secret,
    },
    signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new Error("Place search unavailable");
  return normalizePlaces(await response.json());
}
