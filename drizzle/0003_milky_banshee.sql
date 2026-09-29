CREATE TABLE `day_stickers` (
	`date` text PRIMARY KEY NOT NULL,
	`stickerId` text,
	`version` integer DEFAULT 1 NOT NULL,
	`updatedAt` integer NOT NULL
);
