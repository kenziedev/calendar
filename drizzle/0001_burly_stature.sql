CREATE TABLE `holiday_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`etag` text DEFAULT '' NOT NULL,
	`updatedAt` integer NOT NULL,
	`retryAt` integer DEFAULT 0 NOT NULL
);
