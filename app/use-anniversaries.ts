"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Anniversary, AnniversaryResponse } from "../lib/anniversaries";
type Api = (
  path: string,
  options?: RequestInit,
) => Promise<AnniversaryResponse>;
export function useAnniversaries(
  token: string,
  api: Api,
  forgetSession: () => void,
) {
  const [rows, setRows] = useState<Anniversary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const sequence = useRef(0),
    busy = useRef(false),
    activeToken = useRef(token);
  activeToken.current = token;
  const refresh = useCallback(async () => {
    if (!token || busy.current) return;
    const request = ++sequence.current;
    try {
      const data = await api("anniversaries");
      if (request !== sequence.current || activeToken.current !== token) return;
      setRows(data.anniversaries);
      setLoaded(true);
      setError("");
    } catch (e) {
      if (request !== sequence.current || activeToken.current !== token) return;
      if ((e as Error & { status?: number }).status === 401) forgetSession();
      else
        setError(
          "기념일을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.",
        );
    }
  }, [token, api, forgetSession]);
  useEffect(() => {
    sequence.current++;
    busy.current = false;
    setRows([]);
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
  const mutate = useCallback(
    async (record: Anniversary, remove = false) => {
      if (!token || busy.current || !loaded) return false;
      busy.current = true;
      setSaving(true);
      setError("");
      const request = ++sequence.current;
      let failure: Error | null = null;
      try {
        const data = await api("anniversaries", {
          method: remove ? "DELETE" : record.id ? "PATCH" : "POST",
          body: JSON.stringify(
            remove ? { id: record.id, version: record.version } : record,
          ),
        });
        if (request !== sequence.current || activeToken.current !== token)
          return false;
        setRows((prev) =>
          remove
            ? prev.filter((a) => a.id !== record.id)
            : [
                ...prev.filter((a) => a.id !== data.anniversary.id),
                data.anniversary,
              ],
        );
        return true;
      } catch (e) {
        if (request !== sequence.current || activeToken.current !== token)
          return false;
        if ((e as Error & { status?: number }).status === 401) forgetSession();
        else failure = e as Error;
        return false;
      } finally {
        if (request === sequence.current && activeToken.current === token) {
          busy.current = false;
          setSaving(false);
          if (failure) {
            await refresh();
            if (activeToken.current === token) setError(failure.message);
          }
        }
      }
    },
    [token, loaded, api, refresh, forgetSession],
  );
  return { rows, loaded, saving, error, refresh, mutate };
}
