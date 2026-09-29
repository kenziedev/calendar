"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DaySticker, StickerId, StickerResponse } from "../lib/stickers";

type Api = (path: string, options?: RequestInit) => Promise<StickerResponse>;
export function useStickers(
  token: string,
  api: Api,
  forgetSession: () => void,
) {
  const [stickers, setStickers] = useState<Record<string, DaySticker>>({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const sequence = useRef(0);
  const busy = useRef(false);
  const rows = useRef(stickers);
  const activeToken = useRef(token);
  activeToken.current = token;
  const refresh = useCallback(async () => {
    if (!token || busy.current) return;
    const request = ++sequence.current;
    try {
      const data = await api("stickers");
      if (request !== sequence.current || activeToken.current !== token) return;
      rows.current = Object.fromEntries(
        data.stickers.map((row) => [row.date, row]),
      );
      setStickers(rows.current);
      setLoaded(true);
      setError("");
    } catch (e) {
      if (request !== sequence.current || activeToken.current !== token) return;
      if ((e as Error & { status?: number }).status === 401) forgetSession();
      else
        setError(
          "스티커를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.",
        );
    }
  }, [token, api, forgetSession]);
  useEffect(() => {
    sequence.current++;
    busy.current = false;
    rows.current = {};
    setStickers({});
    setLoaded(false);
    setSaving(false);
    setError("");
    if (!token) return;
    void refresh();
    const update = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = setInterval(update, 15000);
    window.addEventListener("focus", update);
    window.addEventListener("online", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      sequence.current++;
      clearInterval(timer);
      window.removeEventListener("focus", update);
      window.removeEventListener("online", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [token, refresh]);
  const put = useCallback(
    async (date: string, stickerId: StickerId | null) => {
      if (!token || !loaded || busy.current) return false;
      const previous = rows.current[date];
      if ((previous?.stickerId ?? null) === stickerId) return false;
      busy.current = true;
      setSaving(true);
      setError("");
      const request = ++sequence.current;
      let failure = "";
      try {
        const data = await api("stickers", {
          method: "POST",
          body: JSON.stringify({
            date,
            stickerId,
            version: previous?.version ?? 0,
          }),
        });
        if (request !== sequence.current || activeToken.current !== token)
          return false;
        rows.current = { ...rows.current, [data.sticker.date]: data.sticker };
        setStickers(rows.current);
        return true;
      } catch (e) {
        if (request !== sequence.current || activeToken.current !== token)
          return false;
        if ((e as Error & { status?: number }).status === 401) forgetSession();
        else failure = (e as Error).message;
        return false;
      } finally {
        if (request === sequence.current && activeToken.current === token) {
          busy.current = false;
          setSaving(false);
          // A failed response may still have committed. Reload before the next edit.
          if (failure) {
            setLoaded(false);
            await refresh();
            if (activeToken.current === token) setError(failure);
          }
        }
      }
    },
    [token, loaded, api, forgetSession, refresh],
  );
  return { stickers, loaded, saving, error, refresh, put };
}
