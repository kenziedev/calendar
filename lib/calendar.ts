export const PEOPLE = {
  hyun: { name: "현쪼기", initial: "현", color: "#3478d7", tint: "#edf4ff" },
  jeong: { name: "쩡개굴", initial: "쩡", color: "#23866a", tint: "#eaf7f1" },
  together: { name: "함께", initial: "함", color: "#da5265", tint: "#fff0f2" },
} as const;
export type Owner = keyof typeof PEOPLE;
export type Repeat = "none" | "daily" | "weekly" | "monthly" | "yearly";
export const REPEATS: Record<Repeat, string> = {
  none: "반복 안 함",
  daily: "매일",
  weekly: "매주",
  monthly: "매월",
  yearly: "매년",
};
export type CalendarEvent = {
  id: string;
  createId?: string;
  title: string;
  owner: Owner;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  repeat: Repeat;
  repeatUntil: string;
  location: string;
  notes: string;
  version: number;
};
export type Occurrence = {
  event: CalendarEvent;
  startDate: string;
  endDate: string;
  key: string;
};
const DAY = 86400000;
export function dateNumber(value: string) {
  return Date.parse(value + "T00:00:00Z");
}
export function addDays(value: string, amount: number) {
  return new Date(dateNumber(value) + amount * DAY).toISOString().slice(0, 10);
}
export function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function monthStart(date: string) {
  return date.slice(0, 7) + "-01";
}
export function shiftMonth(date: string, amount: number) {
  const d = new Date(dateNumber(monthStart(date)));
  d.setUTCMonth(d.getUTCMonth() + amount);
  return d.toISOString().slice(0, 10);
}
export function monthDays(month: string) {
  const first = monthStart(month),
    start = addDays(first, -new Date(dateNumber(first)).getUTCDay());
  const end = addDays(shiftMonth(first, 1), -1);
  const count =
    Math.ceil(((dateNumber(end) - dateNumber(start)) / DAY + 1) / 7) * 7;
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}
export function longDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(dateNumber(date)));
}
export function shortDate(date: string) {
  return `${Number(date.slice(5, 7))}월 ${Number(date.slice(8))}일`;
}
export function occurrences(
  events: CalendarEvent[],
  from: string,
  to: string,
): Occurrence[] {
  const result: Occurrence[] = [];
  for (const event of events) {
    const duration = Math.round(
      (dateNumber(event.endDate) - dateNumber(event.startDate)) / DAY,
    );
    const visibleEnd = (end: string) =>
      !event.allDay && event.endTime === "00:00" && duration > 0
        ? addDays(end, -1)
        : end;
    if (event.repeat === "none") {
      if (event.startDate <= to && visibleEnd(event.endDate) >= from)
        result.push({
          event,
          startDate: event.startDate,
          endDate: visibleEnd(event.endDate),
          key: event.id + ":" + event.startDate,
        });
      continue;
    }
    let cursor = addDays(from, -duration);
    if (cursor < event.startDate) cursor = event.startDate;
    const limit =
      event.repeatUntil && event.repeatUntil < to ? event.repeatUntil : to;
    for (; cursor <= limit; cursor = addDays(cursor, 1)) {
      const elapsed = Math.round(
        (dateNumber(cursor) - dateNumber(event.startDate)) / DAY,
      );
      const matches =
        event.repeat === "daily" ||
        (event.repeat === "weekly" && elapsed % 7 === 0) ||
        (event.repeat === "monthly" &&
          cursor.slice(8) === event.startDate.slice(8)) ||
        (event.repeat === "yearly" &&
          cursor.slice(5) === event.startDate.slice(5));
      const endDate = visibleEnd(addDays(cursor, duration));
      if (matches && endDate >= from)
        result.push({
          event,
          startDate: cursor,
          endDate,
          key: event.id + ":" + cursor,
        });
    }
  }
  return result.sort(
    (a, b) =>
      a.startDate.localeCompare(b.startDate) ||
      Number(b.event.allDay) - Number(a.event.allDay) ||
      a.event.startTime.localeCompare(b.event.startTime) ||
      a.event.title.localeCompare(b.event.title),
  );
}
export function newEvent(date: string, owner: Owner = "hyun"): CalendarEvent {
  return {
    id: "",
    createId: crypto.randomUUID(),
    title: "",
    owner,
    startDate: date,
    endDate: date,
    startTime: "09:00",
    endTime: "10:00",
    allDay: false,
    repeat: "none",
    repeatUntil: "",
    location: "",
    notes: "",
    version: 0,
  };
}
