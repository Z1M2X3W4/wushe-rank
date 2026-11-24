CREATE TABLE `campus_bindings` (
	`subject` text PRIMARY KEY NOT NULL,
	`member` integer NOT NULL,
	CONSTRAINT "campus_member_range" CHECK("campus_bindings"."member" BETWEEN 1 AND 318)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `campus_bindings_member_unique` ON `campus_bindings` (`member`);--> statement-breakpoint
CREATE TABLE `campus_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`subject` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `campus_session_expiry` ON `campus_sessions` (`expires`);