export type MapPoint = { latitude: number; longitude: number };

export function validMapPoint(point: unknown): point is MapPoint {
  if (!point || typeof point !== "object") return false;
  const { latitude, longitude } = point as MapPoint;
  return (
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !(latitude === 0 && longitude === 0)
  );
}

/** Local search uses WGS84, with legacy integer responses scaled by 10^7. */
export function naverMapPoint(mapx: unknown, mapy: unknown): MapPoint | null {
  const parse = (value: unknown, limit: number) => {
    if (typeof value !== "string" && typeof value !== "number") return NaN;
    if (typeof value === "string" && !/^-?\d+(?:\.\d+)?$/.test(value.trim()))
      return NaN;
    const n = Number(value);
    return Math.abs(n) <= limit
      ? n
      : Number.isInteger(n) && Math.abs(n) >= 1e7
        ? n / 1e7
        : NaN;
  };
  const point = { longitude: parse(mapx, 180), latitude: parse(mapy, 90) };
  return validMapPoint(point) ? point : null;
}
