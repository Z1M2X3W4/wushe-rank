CREATE TABLE `__new_votes` (
	`day` text NOT NULL,
	`voter` integer NOT NULL,
	`candidate` integer NOT NULL,
	PRIMARY KEY(`voter`, `day`, `candidate`)
);
--> statement-breakpoint
INSERT INTO `__new_votes`("day", "voter", "candidate") SELECT "day", "voter", "candidate" FROM `votes`;--> statement-breakpoint
DROP TABLE `votes`;--> statement-breakpoint
ALTER TABLE `__new_votes` RENAME TO `votes`;--> statement-breakpoint
CREATE INDEX `votes_day_candidate` ON `votes` (`day`,`candidate`);
