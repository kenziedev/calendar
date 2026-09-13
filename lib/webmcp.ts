import { occurrences, type CalendarEvent } from "./calendar";
type ModelContext = {
  registerTool: (
    tool: {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: object;
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};
export function registerCalendarTool(readEvents: () => CalendarEvent[]) {
  const context = (document as Document & { modelContext?: ModelContext })
    .modelContext;
  if (!context?.registerTool) return;
  const lifecycle = new AbortController();
  const validDate = (value: unknown): value is string =>
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value + "T00:00:00Z")) &&
    new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value;
  try {
    Promise.resolve(
      context.registerTool(
        {
          name: "read_calendar_schedule",
          title: "공유 일정 조회",
          description:
            "열려 있는 우리의 달력에서 지정한 날짜 범위의 현쪼기·쩡개굴·함께 일정을 읽습니다. 일정을 변경하지 않습니다.",
          inputSchema: {
            type: "object",
            properties: {
              from: { type: "string", format: "date" },
              to: { type: "string", format: "date" },
            },
            required: ["from", "to"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute(input) {
            const value = input as { from?: unknown; to?: unknown };
            if (
              !value ||
              !validDate(value.from) ||
              !validDate(value.to) ||
              value.from > value.to ||
              Date.parse(value.to) - Date.parse(value.from) > 366 * 86400000
            )
              throw new Error("최대 1년의 올바른 날짜 범위를 입력해 주세요.");
            return occurrences(readEvents(), value.from, value.to).map(
              ({ event, startDate, endDate }) => ({
                id: event.id,
                title: event.title,
                owner: event.owner,
                startDate,
                endDate,
                allDay: event.allDay,
                startTime: event.startTime,
                endTime: event.endTime,
                location: event.location,
                notes: event.notes,
              }),
            );
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch(() => {});
  } catch {
    /* Unsupported browser: standard UI remains available. */
  }
  return () => lifecycle.abort();
}
