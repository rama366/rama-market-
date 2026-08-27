CREATE TABLE `wishlists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`listingId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wishlists_id` PRIMARY KEY(`id`),
	CONSTRAINT `wishlists_user_listing_unique` UNIQUE(`userId`,`listingId`)
);
--> statement-breakpoint
ALTER TABLE `marketplaceProfiles` ADD `latitudeE6` int;--> statement-breakpoint
ALTER TABLE `marketplaceProfiles` ADD `longitudeE6` int;