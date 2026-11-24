CREATE TABLE `browser_voters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`token_hash` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `browser_voters_token_hash_unique` ON `browser_voters` (`token_hash`);