/** Open saved place text in NAVER Maps; never use arbitrary input as a URL. */
export function naverMapUrl(location: string): string | null {
  const query = location.trim();
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
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
}
