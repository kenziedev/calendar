/** Open saved place text in NAVER Maps; never use arbitrary input as a URL. */
export function naverMapUrl(location: string): string | null {
  let query = location.trim();
  if (!query) return null;
  try {
    const url = new URL(query);
    if (
      url.protocol === "https:" &&
      ["map.naver.com", "m.map.naver.com", "naver.me"].includes(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.port
    )
      return url.href;
  } catch {
    // A place name or street address is a search query.
  }
  // Search selections store "name · address" for display. NAVER Maps can
  // misinterpret the full display text (especially buildings and floor numbers).
  const koreanAddress =
    /^(?:서울(?:특별시)?|부산(?:광역시)?|대구(?:광역시)?|인천(?:광역시)?|광주(?:광역시)?|대전(?:광역시)?|울산(?:광역시)?|세종(?:특별자치시)?|경기(?:도)?|강원(?:도|특별자치도)?|충북|충청북도|충남|충청남도|전북(?:특별자치도)?|전라북도|전남|전라남도|경북|경상북도|경남|경상남도|제주(?:도|특별자치도)?)\s+\S/;
  const parts = query.split(" · ");
  for (let i = parts.length - 1; i > 0; i--) {
    if (koreanAddress.test(parts[i])) {
      query = parts.slice(0, i).join(" · ").trim();
      break;
    }
  }
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
}
