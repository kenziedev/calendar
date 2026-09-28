"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, MapPin } from "lucide-react";
import { validMapPoint, type MapPoint } from "../lib/coordinates";

export default function PlaceMap({
  point,
  location,
  expanded = false,
}: {
  point: MapPoint | null | undefined;
  location: string;
  expanded?: boolean;
}) {
  const [open, setOpen] = useState(expanded);
  if (!location.trim() || !validMapPoint(point)) return null;
  const { latitude, longitude } = point;
  const url = new URL("https://www.openstreetmap.org/export/embed.html");
  url.searchParams.set(
    "bbox",
    [
      Math.max(-180, longitude - 0.006),
      Math.max(-85, latitude - 0.004),
      Math.min(180, longitude + 0.006),
      Math.min(85, latitude + 0.004),
    ]
      .map((n) => n.toFixed(7))
      .join(","),
  );
  url.searchParams.set("layer", "mapnik");
  url.searchParams.set("marker", `${latitude},${longitude}`);
  return (
    <section className="place-map" aria-label={`${location} 위치 미리보기`}>
      <button
        className="place-map-toggle"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <MapPin size={15} />
        <span>{open ? "위치 미리보기" : "작은 지도 보기"}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <>
          <iframe
            key={`${latitude},${longitude}`}
            src={url.href}
            title={`${location} 지도`}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="place-map-frame"
          />
          <p className="place-map-credit">
            <span>선택한 장소 주변</span>
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
            >
              © OpenStreetMap
            </a>
          </p>
        </>
      )}
    </section>
  );
}
