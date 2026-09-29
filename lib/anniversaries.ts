import { addDays, dateNumber } from "./calendar.ts";
import type { Owner } from "./calendar.ts";

export type Anniversary = {
  id: string;
  createId?: string;
  title: string;
  owner: Owner;
  kind: "birthday" | "anniversary";
  startDate: string;
  yearly: boolean;
  each100: boolean;
  countFromOne: boolean;
  version: number;
};

export type AnniversaryOccurrence = {
  anniversary: Anniversary;
  date: string;
  title: string;
  label: string;
  key: string;
};

export type AnniversaryResponse = {
  anniversaries: Anniversary[];
  anniversary: Anniversary;
};

const DAY = 86400000;
const MIN_DATE = "1900-01-01";
const MAX_DATE = "2100-12-31";

function isExactDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = dateNumber(value);
  return (
    Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === value
  );
}

function annualDate(startDate: string, year: number): string {
  const monthDay = startDate.slice(5);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  return `${year}-${monthDay === "02-29" && !leapYear ? "02-28" : monthDay}`;
}

export function newAnniversary(date: string): Anniversary {
  return {
    id: "",
    createId: crypto.randomUUID(),
    title: "",
    owner: "together",
    kind: "anniversary",
    startDate: date,
    yearly: true,
    each100: true,
    countFromOne: true,
    version: 0,
  };
}

export function anniversaryOccurrences(
  rows: Anniversary[],
  from: string,
  to: string,
): AnniversaryOccurrence[] {
  if (!isExactDate(from) || !isExactDate(to) || from > to) return [];
  const lower = from < MIN_DATE ? MIN_DATE : from;
  const upper = to > MAX_DATE ? MAX_DATE : to;
  if (lower > upper) return [];

  const result: AnniversaryOccurrence[] = [];
  for (const anniversary of rows) {
    const { startDate } = anniversary;
    if (!isExactDate(startDate) || startDate < MIN_DATE || startDate > upper)
      continue;

    const identity =
      anniversary.id ||
      anniversary.createId ||
      `${anniversary.kind}:${startDate}:${anniversary.owner}:${anniversary.title}`;
    const append = (date: string, label: string, category: string) => {
      if (date < lower || date > upper || date < startDate) return;
      const title =
        anniversary.kind === "birthday"
          ? anniversary.title.endsWith("생일")
            ? anniversary.title
            : `${anniversary.title} 생일`
          : `${anniversary.title} · ${label}`;
      result.push({
        anniversary,
        date,
        title,
        label,
        key: `${identity}:${category}:${date}`,
      });
    };

    const startYear = Number(startDate.slice(0, 4));
    const firstYear = Math.max(startYear, Number(lower.slice(0, 4)));
    const lastYear = Number(upper.slice(0, 4));

    if (anniversary.kind === "birthday") {
      for (let year = firstYear; year <= lastYear; year++) {
        append(annualDate(startDate, year), "생일", "birthday");
      }
      continue;
    }

    append(startDate, "시작일", "start");
    if (anniversary.yearly) {
      for (
        let year = Math.max(startYear + 1, firstYear);
        year <= lastYear;
        year++
      ) {
        const years = year - startYear;
        append(annualDate(startDate, year), `${years}주년`, `year:${years}`);
      }
    }

    if (anniversary.each100) {
      const start = dateNumber(startDate);
      const offset = anniversary.countFromOne ? 1 : 0;
      const first = Math.max(
        1,
        Math.ceil(((dateNumber(lower) - start) / DAY + offset) / 100),
      );
      const last = Math.floor(
        ((dateNumber(upper) - start) / DAY + offset) / 100,
      );
      for (let milestone = first; milestone <= last; milestone++) {
        const days = milestone * 100;
        append(addDays(startDate, days - offset), `${days}일`, `days:${days}`);
      }
    }
  }
  return result.sort(
    (a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title),
  );
}
