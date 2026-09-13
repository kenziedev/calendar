"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type CSSProperties,
} from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  LockKeyhole,
  ArrowRight,
  X,
  Check,
  MapPin,
  Clock3,
  Repeat2,
  Trash2,
  CalendarCheck2,
  RefreshCw,
  List,
  Search,
  LoaderCircle,
  LogOut,
} from "lucide-react";
import {
  PEOPLE,
  REPEATS,
  addDays,
  today,
  monthStart,
  shiftMonth,
  monthDays,
  occurrences,
  longDate,
  shortDate,
  newEvent,
  type Owner,
  type CalendarEvent,
  type Occurrence,
} from "../lib/calendar";
import { registerCalendarTool } from "../lib/webmcp";
import type { HolidayCalendar } from "../lib/holidays";
const API_ORIGIN = "https://kenzie-our-calendar.ohhs2.chatgpt.site";
const SESSION_KEY = "our-calendar-session-v1";
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
type ApiError = Error & { status?: number };
export default function Calendar() {
  const [ready, setReady] = useState(false),
    [token, setToken] = useState("");
  const [pin, setPin] = useState(""),
    [loginError, setLoginError] = useState(""),
    [loggingIn, setLoggingIn] = useState(false);
  const [month, setMonth] = useState("2026-09-01"),
    [selected, setSelected] = useState("2026-09-13"),
    [currentDay, setCurrentDay] = useState("2026-09-13");
  const [events, setEvents] = useState<CalendarEvent[]>([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const [owners, setOwners] = useState<Owner[]>(["hyun", "jeong", "together"]),
    [view, setView] = useState<"month" | "list">("month"),
    [query, setQuery] = useState("");
  const [editing, setEditing] = useState<CalendarEvent | null>(null),
    [saving, setSaving] = useState(false),
    [formError, setFormError] = useState(""),
    [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState(""),
    [lastSync, setLastSync] = useState("");
  const [holidayCalendar, setHolidayCalendar] =
    useState<HolidayCalendar | null>(null);
  const [holidayError, setHolidayError] = useState("");
  const [holidayLoading, setHolidayLoading] = useState(false);
  const holidayRequestId = useRef(0);
  const dialog = useRef<HTMLDialogElement>(null),
    returnFocus = useRef<HTMLElement | null>(null),
    requestId = useRef(0);
  useEffect(() => {
    const day = today();
    setCurrentDay(day);
    setMonth(monthStart(day));
    setSelected(day);
    try {
      setToken(sessionStorage.getItem(SESSION_KEY) || "");
    } catch {}
    setReady(true);
  }, []);
  const api = useCallback(
    async (path: string, options: RequestInit = {}, session = token) => {
      const base =
        location.hostname === "kenzie.kr" ||
        location.hostname.endsWith("github.io")
          ? API_ORIGIN
          : "";
      const response = await fetch(base + "/api/" + path, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session}` } : {}),
          ...options.headers,
        },
        cache: "no-store",
      });
      const data = (await response.json().catch(() => ({
        error: "서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.",
      }))) as {
        error?: string;
        events: CalendarEvent[];
        event: CalendarEvent;
        token: string;
        holidayCalendar: HolidayCalendar;
      };
      if (!response.ok) {
        const e = new Error(
          data.error || "요청을 처리하지 못했어요.",
        ) as ApiError;
        e.status = response.status;
        throw e;
      }
      return data;
    },
    [token],
  );
  const forgetSession = useCallback(() => {
    requestId.current++;
    holidayRequestId.current++;
    setHolidayCalendar(null);
    setHolidayError("");
    setHolidayLoading(false);
    setToken("");
    setEvents([]);
    setEditing(null);
    setLastSync("");
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {}
  }, []);
  const refresh = useCallback(
    async (quiet = false) => {
      if (!token) return;
      const id = ++requestId.current;
      if (!quiet) setLoading(true);
      try {
        const data = await api("events");
        if (id !== requestId.current) return;
        setEvents(data.events);
        setError("");
        setLastSync(
          new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
      } catch (e) {
        if (id !== requestId.current) return;
        const err = e as ApiError;
        if (err.status === 401) {
          forgetSession();
          setLoginError("다시 비밀번호를 입력해 주세요.");
        } else setError(err.message);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [token, api, forgetSession],
  );
  useEffect(() => {
    if (!token) return;
    void refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        setCurrentDay(today());
        void refresh(true);
      }
    }, 15000);
    const focus = () => void refresh(true);
    window.addEventListener("focus", focus);
    window.addEventListener("online", focus);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", focus);
      window.removeEventListener("online", focus);
    };
  }, [token, refresh]);
  const refreshHolidays = useCallback(async () => {
    if (!token) return;
    const id = ++holidayRequestId.current;
    setHolidayLoading(true);
    try {
      const data = await api("holidays");
      if (id !== holidayRequestId.current) return;
      setHolidayCalendar(data.holidayCalendar);
      setHolidayError("");
    } catch (e) {
      if (id !== holidayRequestId.current) return;
      if ((e as ApiError).status === 401) forgetSession();
      else setHolidayError("공휴일 자료 연결 실패 · 새로고침해 주세요");
    } finally {
      if (id === holidayRequestId.current) setHolidayLoading(false);
    }
  }, [api, token, forgetSession]);
  useEffect(() => {
    if (!token) return;
    void refreshHolidays();
    const focus = () => {
      if (document.visibilityState === "visible") void refreshHolidays();
    };
    const timer = setInterval(focus, 10 * 60 * 1000);
    window.addEventListener("focus", focus);
    window.addEventListener("online", focus);
    document.addEventListener("visibilitychange", focus);
    return () => {
      holidayRequestId.current++;
      clearInterval(timer);
      window.removeEventListener("focus", focus);
      window.removeEventListener("online", focus);
      document.removeEventListener("visibilitychange", focus);
    };
  }, [token, refreshHolidays]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (editing) {
      returnFocus.current = document.activeElement as HTMLElement;
      dialog.current?.showModal();
      dialog.current?.querySelector<HTMLInputElement>("#event-title")?.focus();
    } else {
      dialog.current?.close();
      returnFocus.current?.focus();
    }
  }, [!!editing]);
  const eventsRef = useRef(events);
  eventsRef.current = events;
  useEffect(() => {
    if (token) return registerCalendarTool(() => eventsRef.current);
  }, [token]);
  async function login(e: FormEvent) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError("");
    try {
      const data = await api(
        "session",
        { method: "POST", body: JSON.stringify({ pin }) },
        "",
      );
      try {
        sessionStorage.setItem(SESSION_KEY, data.token);
      } catch {}
      setToken(data.token);
      setPin("");
    } catch (err) {
      setLoginError((err as Error).message);
    } finally {
      setLoggingIn(false);
    }
  }
  async function logout() {
    const session = token;
    forgetSession();
    setLoading(false);
    setError("");
    try {
      await api("session", { method: "DELETE" }, session);
    } catch {
      /* The device locks immediately, including offline. */
    }
  }
  const days = useMemo(() => monthDays(month), [month]);
  const visible = useMemo(
    () =>
      events.filter(
        (e) =>
          owners.includes(e.owner) &&
          (!query ||
            `${e.title} ${e.location} ${e.notes}`
              .toLowerCase()
              .includes(query.toLowerCase())),
      ),
    [events, owners, query],
  );
  const visibleOccurrences = useMemo(
    () => occurrences(visible, days[0], days[days.length - 1]),
    [visible, days],
  );
  const inMonth = useMemo(
    () =>
      visibleOccurrences.filter(
        (o) => o.startDate < shiftMonth(month, 1) && o.endDate >= month,
      ),
    [visibleOccurrences, month],
  );
  const dayEvents = useMemo(
    () => occurrences(visible, selected, selected),
    [visible, selected],
  );
  const holidays = holidayCalendar?.holidays ?? {};
  const monthRows = [
    ...inMonth.map((item) => ({
      date: item.startDate,
      key: item.key,
      item,
      names: [] as string[],
    })),
    ...Object.entries(holidays)
      .filter(
        ([date, names]) =>
          date.slice(0, 7) === month.slice(0, 7) &&
          (!query ||
            names.join(" ").toLowerCase().includes(query.toLowerCase())),
      )
      .map(([date, names]) => ({
        date,
        key: `holiday-${date}`,
        item: null,
        names,
      })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = useMemo(
    () =>
      occurrences(
        events.filter((e) => e.owner === "together"),
        currentDay,
        addDays(currentDay, 60),
      ).slice(0, 3),
    [events, currentDay],
  );
  function changeMonth(amount: number) {
    const next = shiftMonth(month, amount);
    setMonth(next);
    setSelected(next);
  }
  function goToday() {
    const d = today();
    setSelected(d);
    setMonth(monthStart(d));
  }
  function openEditor(event?: CalendarEvent) {
    setFormError("");
    setConfirmDelete(false);
    let preferred: Owner = "hyun";
    try {
      const saved = localStorage.getItem("our-calendar-owner");
      if (saved && saved in PEOPLE) preferred = saved as Owner;
    } catch {}
    setEditing(event ? { ...event } : newEvent(selected, preferred));
  }
  function update(field: keyof CalendarEvent, value: string | boolean) {
    setEditing((prev) =>
      prev
        ? {
            ...prev,
            [field]: value,
            ...(field === "startDate" && String(value) > prev.endDate
              ? { endDate: String(value) }
              : {}),
          }
        : null,
    );
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setFormError("");
    try {
      const result = await api("events", {
        method: editing.id ? "PATCH" : "POST",
        body: JSON.stringify(editing),
      });
      requestId.current++;
      setEvents((prev) => [
        ...prev.filter((ev) => ev.id !== result.event.id),
        result.event,
      ]);
      setLoading(false);
      try {
        localStorage.setItem("our-calendar-owner", editing.owner);
      } catch {}
      setSelected(editing.startDate);
      setMonth(monthStart(editing.startDate));
      setEditing(null);
      setToast(
        editing.id ? "일정을 수정했어요" : "공유 캘린더에 일정을 추가했어요",
      );
      void refresh(true);
    } catch (e) {
      const err = e as ApiError;
      setFormError(err.message);
      if (err.status === 409) void refresh(true);
      if (err.status === 401) {
        forgetSession();
        setLoginError("세션이 만료됐어요. 다시 열어 주세요.");
      }
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    if (!editing) return;
    setSaving(true);
    setFormError("");
    try {
      await api("events", {
        method: "DELETE",
        body: JSON.stringify({ id: editing.id, version: editing.version }),
      });
      requestId.current++;
      setEvents((prev) => prev.filter((e) => e.id !== editing.id));
      setLoading(false);
      setEditing(null);
      setToast("일정을 삭제했어요");
      void refresh(true);
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }
  const EventCard = ({ item }: { item: Occurrence }) => (
    <button
      className={`agenda-card ${item.event.owner}`}
      onClick={() => openEditor(item.event)}
    >
      <span className="agenda-time">
        {item.event.allDay ? "종일" : item.event.startTime}
        <span>{item.event.allDay ? "" : item.event.endTime}</span>
      </span>
      <span className="agenda-content">
        <strong>{item.event.title}</strong>
        <span className="event-owner">
          {PEOPLE[item.event.owner].name}
          {item.event.repeat !== "none" && <Repeat2 size={12} />}
        </span>
        {item.event.location && (
          <span className="event-location">
            <MapPin size={12} />
            {item.event.location}
          </span>
        )}
        {item.startDate !== item.endDate && (
          <span className="event-location">
            {shortDate(item.startDate)} – {shortDate(item.endDate)}
          </span>
        )}
      </span>
      <ChevronRight size={15} className="card-arrow" />
    </button>
  );
  if (!ready)
    return (
      <main className="boot">
        <CalendarDays size={34} />
        <span>공유 캘린더</span>
      </main>
    );
  if (!token)
    return (
      <main className="lock-screen">
        <div className="login-card">
          <h1>
            <CalendarDays size={25} />
            공유 캘린더
          </h1>
          <form onSubmit={login}>
            <label htmlFor="pin">비밀번호</label>
            <div className="pin-field">
              <LockKeyhole size={18} />
              <input
                id="pin"
                aria-describedby={loginError ? "login-error" : undefined}
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                minLength={4}
                autoComplete="current-password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="비밀번호 4자리"
                required
                autoFocus
              />
            </div>
            {loginError && (
              <p id="login-error" className="error-text" role="alert">
                {loginError}
              </p>
            )}
            <button
              className="primary login-submit"
              disabled={loggingIn || pin.length !== 4}
            >
              {loggingIn ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <>
                  달력 열기 <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            goToday();
          }}
        >
          <span className="brand-icon">
            <CalendarDays size={22} />
          </span>
          <span>공유 캘린더</span>
        </a>
        <button className="primary sidebar-add" onClick={() => openEditor()}>
          <Plus size={18} />새 일정
        </button>
        <div className="mini-month">
          <div>
            <strong>
              {Number(month.slice(0, 4))}년 {Number(month.slice(5, 7))}월
            </strong>
            <span>
              <button aria-label="이전 달" onClick={() => changeMonth(-1)}>
                <ChevronLeft size={16} />
              </button>
              <button aria-label="다음 달" onClick={() => changeMonth(1)}>
                <ChevronRight size={16} />
              </button>
            </span>
          </div>
          <div className="mini-grid">
            {WEEKDAYS.map((d, i) => (
              <span
                className={i === 0 ? "sunday" : i === 6 ? "saturday" : ""}
                key={d}
              >
                {d}
              </span>
            ))}
            {days.map((d, i) => (
              <button
                className={`${d.slice(0, 7) !== month.slice(0, 7) ? "muted" : ""} ${d === selected ? "active" : ""} ${d === currentDay ? "is-today" : ""} ${i % 7 === 0 ? "sunday" : i % 7 === 6 ? "saturday" : ""} ${holidays[d] ? "holiday" : ""}`}
                aria-label={`작은 달력 ${longDate(d)}${holidays[d] ? `, ${holidays[d].join(" · ")}` : ""}`}
                key={d}
                onClick={() => {
                  setSelected(d);
                  setMonth(monthStart(d));
                }}
              >
                {Number(d.slice(8))}
              </button>
            ))}
          </div>
        </div>
        <div className="sidebar-label">캘린더</div>
        <div className="owner-filters">
          {(Object.keys(PEOPLE) as Owner[]).map((owner) => (
            <button
              key={owner}
              className={`owner-filter ${owner}`}
              aria-pressed={owners.includes(owner)}
              onClick={() =>
                setOwners((prev) =>
                  prev.includes(owner)
                    ? prev.filter((o) => o !== owner)
                    : [...prev, owner],
                )
              }
            >
              <span className="owner-check">
                {owners.includes(owner) && <Check size={12} strokeWidth={3} />}
              </span>
              <span>{PEOPLE[owner].name}</span>
              <span className="owner-count">
                {
                  occurrences(
                    events.filter((e) => e.owner === owner),
                    month,
                    addDays(shiftMonth(month, 1), -1),
                  ).length
                }
              </span>
            </button>
          ))}
        </div>
        <div className="together-section">
          <div className="sidebar-label">
            <CalendarDays size={13} />
            다가오는 함께 일정
          </div>
          {upcoming.length ? (
            upcoming.map((o) => (
              <button
                className="upcoming-item"
                key={o.key}
                onClick={() => {
                  setSelected(o.startDate);
                  setMonth(monthStart(o.startDate));
                  openEditor(o.event);
                }}
              >
                <span>{shortDate(o.startDate)}</span>
                <strong>{o.event.title}</strong>
              </button>
            ))
          ) : (
            <p className="sidebar-empty">예정된 함께 일정이 없습니다.</p>
          )}
        </div>
        <div className="sidebar-bottom">
          <div className="mini-avatars">
            <span className="avatar hyun">현</span>
            <span className="avatar jeong">쩡</span>
            <span>
              공유 일정<small>Asia/Seoul · 서울</small>
            </span>
          </div>
          <button className="lock-button" onClick={logout}>
            <LogOut size={15} />
            달력 잠그기
          </button>
        </div>
      </aside>
      <main className="workspace">
        <header className="topbar">
          <div className="mobile-brand">
            <CalendarDays size={21} />
            공유 캘린더
          </div>
          <div className="breadcrumb">
            일정 관리 <span>/</span> 캘린더
          </div>
          <div className="topbar-right">
            <span className="sync-text">
              {loading
                ? "불러오는 중"
                : lastSync
                  ? "변경 사항 자동 반영"
                  : "연결 중"}
            </span>
            <button
              className="icon-button"
              title="일정 및 공휴일 새로고침"
              aria-label="일정 및 공휴일 새로고침"
              onClick={() => {
                void refresh();
                void refreshHolidays();
              }}
              disabled={loading || holidayLoading}
            >
              <RefreshCw size={16} className={loading ? "spin" : ""} />
            </button>
            <button
              className="icon-button mobile-lock"
              aria-label="달력 잠그기"
              onClick={logout}
            >
              <LockKeyhole size={17} />
            </button>
            <div className="top-avatars">
              <span className="avatar hyun">현</span>
              <span className="avatar jeong">쩡</span>
            </div>
          </div>
        </header>
        <div className="calendar-header">
          <div>
            <p className="month-eyebrow">{month.slice(0, 4)}년</p>
            <h1>
              {Number(month.slice(5, 7))}월{" "}
              <span>
                {new Intl.DateTimeFormat("en-US", {
                  month: "long",
                  timeZone: "UTC",
                }).format(new Date(month + "T00:00:00Z"))}
              </span>
            </h1>
          </div>
          <div className="month-actions">
            <button className="today-button" onClick={goToday}>
              오늘
            </button>
            <div className="month-nav">
              <button aria-label="지난달 보기" onClick={() => changeMonth(-1)}>
                <ChevronLeft size={20} />
              </button>
              <button aria-label="다음달 보기" onClick={() => changeMonth(1)}>
                <ChevronRight size={20} />
              </button>
            </div>
            <button className="primary header-add" onClick={() => openEditor()}>
              <Plus size={17} />
              일정 추가
            </button>
          </div>
        </div>
        <div className="calendar-toolbar">
          <div className="mobile-filters">
            {(Object.keys(PEOPLE) as Owner[]).map((owner) => (
              <button
                key={owner}
                className={`filter-chip ${owner} ${owners.includes(owner) ? "selected" : ""}`}
                aria-pressed={owners.includes(owner)}
                onClick={() =>
                  setOwners((prev) =>
                    prev.includes(owner)
                      ? prev.filter((o) => o !== owner)
                      : [...prev, owner],
                  )
                }
              >
                <span className="dot" />
                {PEOPLE[owner].name}
              </button>
            ))}
          </div>
          <div className="month-summary">
            이번 달 일정 <strong>{inMonth.length}</strong>
          </div>
          <div className="toolbar-right">
            <label className="search">
              <Search size={16} />
              <input
                aria-label="일정 검색"
                placeholder="일정 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button aria-label="검색 지우기" onClick={() => setQuery("")}>
                  <X size={14} />
                </button>
              )}
            </label>
            <div className="view-toggle" aria-label="달력 보기 방식">
              <button
                className={view === "month" ? "active" : ""}
                aria-label="월별 보기"
                aria-pressed={view === "month"}
                onClick={() => setView("month")}
              >
                <CalendarDays size={16} />
                <span>월</span>
              </button>
              <button
                className={view === "list" ? "active" : ""}
                aria-label="목록 보기"
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
              >
                <List size={17} />
                <span>목록</span>
              </button>
            </div>
          </div>
        </div>
        {error && (
          <div className="connection-error" role="alert">
            {error}
            <button onClick={() => void refresh()}>다시 시도</button>
          </div>
        )}
        <div className="calendar-body">
          <section
            className="calendar-surface"
            aria-label={`${month.slice(0, 4)}년 ${Number(month.slice(5, 7))}월 달력`}
          >
            {view === "month" ? (
              <>
                <div className="weekdays">
                  {WEEKDAYS.map((d, i) => (
                    <span
                      key={d}
                      className={i === 0 ? "sunday" : i === 6 ? "saturday" : ""}
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <div
                  className="month-grid"
                  style={{ "--weeks": days.length / 7 } as CSSProperties}
                >
                  {days.map((date, index) => {
                    const items = visibleOccurrences.filter(
                      (o) => o.startDate <= date && o.endDate >= date,
                    );
                    return (
                      <div
                        key={date}
                        className={`day-cell ${date.slice(0, 7) !== month.slice(0, 7) ? "outside" : ""} ${date === selected ? "selected-day" : ""} ${index % 7 === 0 ? "sunday" : index % 7 === 6 ? "saturday" : ""} ${holidays[date] ? "holiday" : ""}`}
                      >
                        <button
                          className="day-hit"
                          aria-label={`${longDate(date)}${holidays[date] ? `, 공휴일 ${holidays[date].join(" · ")}` : ""}, 일정 ${items.length}개`}
                          aria-pressed={date === selected}
                          onClick={() => setSelected(date)}
                          onDoubleClick={() => {
                            setSelected(date);
                            setFormError("");
                            setConfirmDelete(false);
                            setEditing(newEvent(date));
                          }}
                        >
                          <span
                            className={`day-number ${date === currentDay ? "today-number" : ""}`}
                          >
                            {Number(date.slice(8))}
                          </span>
                          {date === currentDay && (
                            <span className="today-label">오늘</span>
                          )}
                        </button>
                        {holidays[date] && (
                          <button
                            className="holiday-label"
                            title={holidays[date].join(" · ")}
                            onClick={() => setSelected(date)}
                          >
                            {holidays[date].join(" · ")}
                          </button>
                        )}
                        <div className="cell-events">
                          {items.slice(0, 3).map((o) => (
                            <button
                              className={`calendar-event ${o.event.owner} ${o.event.allDay || o.startDate !== o.endDate ? "filled" : ""}`}
                              key={o.key}
                              onClick={() => {
                                setSelected(date);
                                openEditor(o.event);
                              }}
                              title={`${PEOPLE[o.event.owner].name} · ${o.event.title}`}
                            >
                              <span className="event-dot" />
                              <span>{o.event.title}</span>
                              {!o.event.allDay && (
                                <small>{o.event.startTime}</small>
                              )}
                            </button>
                          ))}
                          {items.length > 3 && (
                            <button
                              className="more-events"
                              onClick={() => setSelected(date)}
                            >
                              +{items.length - 3}개 더
                            </button>
                          )}
                        </div>
                        <div className="mobile-dots">
                          {items.slice(0, 5).map((o) => (
                            <i key={o.key} className={o.event.owner} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="month-list">
                {monthRows.length ? (
                  monthRows.map((row) => (
                    <div
                      className={`month-list-row ${row.names.length ? "holiday-row" : ""}`}
                      key={row.key}
                    >
                      <div>
                        {shortDate(row.date)}
                        <small>
                          {
                            WEEKDAYS[
                              new Date(row.date + "T00:00:00Z").getUTCDay()
                            ]
                          }
                          요일
                        </small>
                      </div>
                      {row.item ? (
                        <EventCard item={row.item} />
                      ) : (
                        <button
                          className="holiday-list-card"
                          onClick={() => setSelected(row.date)}
                        >
                          <span>공휴일</span>
                          <strong>{row.names.join(" · ")}</strong>
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="list-empty">
                    <CalendarCheck2 size={36} strokeWidth={1.2} />
                    <h3>
                      {query
                        ? "검색한 일정이 없어요"
                        : "아직 등록된 일정이 없어요"}
                    </h3>
                    <p>
                      {query
                        ? "다른 검색어로 찾아보세요."
                        : "새 일정을 추가하세요."}
                    </p>
                    {!query && (
                      <button
                        className="text-button"
                        onClick={() => openEditor()}
                      >
                        + 일정 추가하기
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="calendar-footnote">
              <span>
                <span className="legend-today" />
                오늘
              </span>
              <span>모든 일정은 서울 시간 기준</span>
              <span className="weekend-legend">
                <i className="saturday" />
                토요일 <i className="sunday" />
                일요일·공휴일
              </span>
            </div>
            <div
              className={`holiday-status ${holidayError || holidayCalendar?.stale || (holidayCalendar && !holidayCalendar.years.includes(Number(month.slice(0, 4)))) ? "warning" : ""}`}
              role="status"
            >
              <span>
                {holidayError ||
                  (holidayCalendar
                    ? !holidayCalendar.years.includes(Number(month.slice(0, 4)))
                      ? `${month.slice(0, 4)}년 공휴일 자료는 아직 제공되지 않습니다`
                      : holidayCalendar.stale
                        ? "공휴일 자료 갱신 지연 · 마지막 확인 자료 표시 중"
                        : "대한민국 공휴일 · 자동 갱신"
                    : holidayLoading
                      ? "공휴일 불러오는 중…"
                      : "공휴일 자료 확인 필요")}
              </span>
              {holidayCalendar && (
                <span title="자료 제공처에 추가된 임시공휴일을 최대 6시간 간격으로 확인합니다.">
                  확인{" "}
                  {new Date(holidayCalendar.updatedAt).toLocaleString("ko-KR", {
                    timeZone: "Asia/Seoul",
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  ·{" "}
                  <a
                    href={holidayCalendar.source}
                    target="_blank"
                    rel="noreferrer"
                  >
                    자료 출처
                  </a>
                </span>
              )}
            </div>
          </section>
          <aside className="day-agenda">
            <div className="agenda-heading">
              <div>
                <p>
                  {WEEKDAYS[new Date(selected + "T00:00:00Z").getUTCDay()]}요일
                </p>
                <h2>
                  {shortDate(selected)}
                  {selected === currentDay && <span>오늘</span>}
                </h2>
              </div>
              <button
                className="icon-button"
                aria-label={`${shortDate(selected)} 일정 추가`}
                onClick={() => openEditor()}
              >
                <Plus size={20} />
              </button>
            </div>
            {holidays[selected] && (
              <div className="agenda-holiday">
                <span>공휴일</span>
                <strong>{holidays[selected].join(" · ")}</strong>
              </div>
            )}
            <div className="agenda-count">일정 {dayEvents.length}개</div>
            {dayEvents.length ? (
              <div className="agenda-items">
                {dayEvents.map((o) => (
                  <EventCard key={o.key} item={o} />
                ))}
              </div>
            ) : (
              <div className="day-empty">
                <div>
                  <CalendarCheck2 size={29} strokeWidth={1.3} />
                </div>
                <strong>
                  {loading
                    ? "일정을 불러오고 있어요"
                    : error
                      ? "연결을 확인해 주세요"
                      : owners.length === 0
                        ? "캘린더를 선택해 주세요"
                        : "등록된 일정이 없습니다"}
                </strong>
                <p>
                  {error
                    ? "연결되면 일정을 다시 표시할게요."
                    : owners.length === 0
                      ? "보고 싶은 사람의 캘린더를 켜주세요."
                      : "새 일정을 추가할 수 있습니다."}
                </p>
                {!error && (
                  <button className="text-button" onClick={() => openEditor()}>
                    일정 추가하기 <Plus size={14} />
                  </button>
                )}
              </div>
            )}
          </aside>
        </div>
      </main>
      <button
        className="mobile-fab"
        aria-label="새 일정 만들기"
        onClick={() => openEditor()}
      >
        <Plus size={26} />
      </button>
      <dialog
        ref={dialog}
        className="event-dialog"
        aria-labelledby="dialog-title"
        onCancel={(e) => {
          if (saving) e.preventDefault();
          else setEditing(null);
        }}
        onClick={(e) => {
          if (e.target === dialog.current && !saving) setEditing(null);
        }}
      >
        {editing && (
          <form onSubmit={save} className="event-form">
            <fieldset disabled={saving} className="form-fields">
              <div className="dialog-heading">
                <div>
                  <p>공유 캘린더</p>
                  <h2 id="dialog-title">
                    {editing.id ? "일정 수정" : "새로운 일정"}
                  </h2>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  aria-label="일정 창 닫기"
                  disabled={saving}
                  onClick={() => setEditing(null)}
                >
                  <X size={21} />
                </button>
              </div>
              <label className="sr-only" htmlFor="event-title">
                일정 제목
              </label>
              <input
                className="event-title-input"
                id="event-title"
                placeholder="일정 제목"
                value={editing.title}
                onChange={(e) => update("title", e.target.value)}
                required
                maxLength={100}
                autoFocus
              />
              <fieldset className="owner-picker">
                <legend>누구의 일정인가요?</legend>
                {(Object.keys(PEOPLE) as Owner[]).map((o) => (
                  <label
                    key={o}
                    className={`${o} ${editing.owner === o ? "chosen" : ""}`}
                  >
                    <input
                      type="radio"
                      name="event-owner"
                      checked={editing.owner === o}
                      onChange={() => update("owner", o)}
                    />
                    <span className="avatar">{PEOPLE[o].initial}</span>
                    {PEOPLE[o].name}
                    {editing.owner === o && <Check size={14} />}
                  </label>
                ))}
              </fieldset>
              <div className="all-day-row">
                <span>
                  <Clock3 size={17} />
                  하루 종일
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={editing.allDay}
                  aria-label="하루 종일"
                  className={`switch ${editing.allDay ? "on" : ""}`}
                  onClick={() => update("allDay", !editing.allDay)}
                >
                  <span />
                </button>
              </div>
              <div className="date-fields">
                <label>
                  시작
                  <div>
                    <input
                      aria-label="시작 날짜"
                      type="date"
                      min="1900-01-01"
                      max="2100-12-31"
                      required
                      value={editing.startDate}
                      onChange={(e) => update("startDate", e.target.value)}
                    />
                    {!editing.allDay && (
                      <input
                        aria-label="시작 시간"
                        type="time"
                        required
                        value={editing.startTime}
                        onChange={(e) => update("startTime", e.target.value)}
                      />
                    )}
                  </div>
                </label>
                <label>
                  종료
                  <div>
                    <input
                      aria-label="종료 날짜"
                      type="date"
                      min={editing.startDate}
                      max="2100-12-31"
                      required
                      value={editing.endDate}
                      onChange={(e) => update("endDate", e.target.value)}
                    />
                    {!editing.allDay && (
                      <input
                        aria-label="종료 시간"
                        type="time"
                        required
                        value={editing.endTime}
                        onChange={(e) => update("endTime", e.target.value)}
                      />
                    )}
                  </div>
                </label>
              </div>
              <label className="form-row">
                <span>
                  <Repeat2 size={17} />
                  반복
                </span>
                <select
                  value={editing.repeat}
                  onChange={(e) => update("repeat", e.target.value)}
                >
                  {Object.entries(REPEATS).map(([v, name]) => (
                    <option key={v} value={v}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              {editing.repeat !== "none" && (
                <>
                  <label className="form-row">
                    <span>
                      반복 종료일 <small>선택</small>
                    </span>
                    <input
                      aria-label="반복 종료일"
                      type="date"
                      min={editing.startDate}
                      max="2100-12-31"
                      value={editing.repeatUntil}
                      onChange={(e) => update("repeatUntil", e.target.value)}
                    />
                  </label>
                  <p className="field-hint">
                    종료일을 비우면 계속 반복해요.
                    {editing.repeat === "monthly" || editing.repeat === "yearly"
                      ? " 해당 날짜가 없는 달은 건너뛰어요."
                      : ""}
                  </p>
                </>
              )}
              <label className="form-row">
                <span>
                  <MapPin size={17} />
                  장소
                </span>
                <input
                  placeholder="장소 입력"
                  maxLength={200}
                  value={editing.location}
                  onChange={(e) => update("location", e.target.value)}
                />
              </label>
              <label className="notes-label">
                메모
                <textarea
                  placeholder="메모 입력"
                  rows={3}
                  maxLength={3000}
                  value={editing.notes}
                  onChange={(e) => update("notes", e.target.value)}
                />
              </label>
              {editing.id && editing.repeat !== "none" && (
                <p className="repeat-notice">
                  <Repeat2 size={15} />
                  수정·삭제하면 반복 일정 전체에 적용돼요.
                </p>
              )}
              {formError && (
                <p className="error-text" role="alert">
                  {formError}
                </p>
              )}
              {confirmDelete ? (
                <div className="delete-confirm" role="alert">
                  <p>
                    {editing.repeat !== "none"
                      ? "반복 일정 전체를 삭제할까요?"
                      : "이 일정을 삭제할까요?"}
                  </p>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={saving}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={remove}
                    disabled={saving}
                  >
                    삭제하기
                  </button>
                </div>
              ) : (
                <div className="dialog-footer">
                  {editing.id && (
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => setConfirmDelete(true)}
                      disabled={saving}
                    >
                      <Trash2 size={17} />
                      삭제
                    </button>
                  )}
                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => setEditing(null)}
                    disabled={saving}
                  >
                    취소
                  </button>
                  <button className="primary" disabled={saving}>
                    {saving ? (
                      <LoaderCircle className="spin" size={17} />
                    ) : (
                      <Check size={17} />
                    )}
                    {saving ? "저장 중" : "저장하기"}
                  </button>
                </div>
              )}
            </fieldset>
          </form>
        )}
      </dialog>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
