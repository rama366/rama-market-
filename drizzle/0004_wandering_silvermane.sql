CREATE TABLE `buyerNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`listingId` int NOT NULL,
	`type` enum('price_drop','status_change') NOT NULL,
	`title` varchar(180) NOT NULL,
	`message` text NOT NULL,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `buyerNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `listings` MODIFY COLUMN `status` enum('draft','published','archived') NOT NULL DEFAULT 'published';