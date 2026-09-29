CREATE TABLE `anniversaries` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`owner` text NOT NULL,
	`kind` text NOT NULL,
	`startDate` text NOT NULL,
	`yearly` integer NOT NULL,
	`each100` integer NOT NULL,
	`countFromOne` integer DEFAULT 1 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`deleted` integer DEFAULT 0 NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
