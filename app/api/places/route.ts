import { env } from "cloudflare:workers";
import { handle, HttpError, requireSession } from "../../../lib/server";
import { searchNaverPlaces } from "../../../lib/places";

export async function GET(request: Request) {
  return handle(request, async () => {
    await requireSession(request);
    const query = new URL(request.url).searchParams.get("q")?.trim() || "";
    if (query.length > 120)
      throw new HttpError(400, "검색어는 120자 이내로 입력해 주세요.");
    const config = env as unknown as {
      NAVER_CLIENT_ID?: string;
      NAVER_CLIENT_SECRET?: string;
    };
    if (!config.NAVER_CLIENT_ID || !config.NAVER_CLIENT_SECRET)
      return { enabled: false, places: [] };
    if (query.length < 2) return { enabled: true, places: [] };
    try {
      return {
        enabled: true,
        places: await searchNaverPlaces(query, {
          id: config.NAVER_CLIENT_ID,
          secret: config.NAVER_CLIENT_SECRET,
        }),
      };
    } catch {
      throw new HttpError(
        503,
        "네이버 장소 검색에 연결하지 못했습니다. 잠시 후 다시 입력해 주세요.",
      );
    }
  });
}
export const OPTIONS = GET;
