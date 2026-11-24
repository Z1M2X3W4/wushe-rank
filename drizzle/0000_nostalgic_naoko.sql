CREATE TABLE `votes` (
	`day` text NOT NULL,
	`voter` integer NOT NULL,
	`candidate` integer NOT NULL,
	PRIMARY KEY(`voter`, `day`)
);
--> statement-breakpoint
CREATE INDEX `votes_day_candidate` ON `votes` (`day`,`candidate`);