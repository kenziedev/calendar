CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`owner` text NOT NULL,
	`startDate` text NOT NULL,
	`endDate` text NOT NULL,
	`startTime` text NOT NULL,
	`endTime` text NOT NULL,
	`allDay` integer NOT NULL,
	`repeat` text DEFAULT 'none' NOT NULL,
	`repeatUntil` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_events_start_date` ON `events` (`startDate`);--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expiresAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_login_attempts_expiry` ON `login_attempts` (`expiresAt`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`tokenHash` text PRIMARY KEY NOT NULL,
	`expiresAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_expiry` ON `sessions` (`expiresAt`);