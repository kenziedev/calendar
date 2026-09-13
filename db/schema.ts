import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    owner: text("owner").notNull(),
    startDate: text("startDate").notNull(),
    endDate: text("endDate").notNull(),
    startTime: text("startTime").notNull(),
    endTime: text("endTime").notNull(),
    allDay: integer("allDay").notNull(),
    repeat: text("repeat").notNull().default("none"),
    repeatUntil: text("repeatUntil").notNull().default(""),
    location: text("location").notNull().default(""),
    notes: text("notes").notNull().default(""),
    version: integer("version").notNull().default(1),
    createdAt: integer("createdAt").notNull(),
    updatedAt: integer("updatedAt").notNull(),
  },
  (table) => [index("idx_events_start_date").on(table.startDate)],
);
export const sessions = sqliteTable(
  "sessions",
  {
    tokenHash: text("tokenHash").primaryKey(),
    expiresAt: integer("expiresAt").notNull(),
  },
  (table) => [index("idx_sessions_expiry").on(table.expiresAt)],
);
export const loginAttempts = sqliteTable(
  "login_attempts",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull(),
    expiresAt: integer("expiresAt").notNull(),
  },
  (table) => [index("idx_login_attempts_expiry").on(table.expiresAt)],
);
