CREATE TABLE `listingEnquiries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`buyerUserId` int NOT NULL,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `listingEnquiries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerProfileId` int NOT NULL,
	`title` varchar(180) NOT NULL,
	`description` text NOT NULL,
	`category` enum('clothing','cars','homes','electronics','services') NOT NULL,
	`priceCents` int,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`location` varchar(160),
	`imageUrl` text,
	`status` enum('draft','published') NOT NULL DEFAULT 'published',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`publishedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `marketplaceProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accountType` enum('buyer','seller') NOT NULL,
	`displayName` varchar(120) NOT NULL,
	`businessName` varchar(160),
	`bio` text,
	`city` varchar(120),
	`phone` varchar(40),
	`membership` enum('free','plus') NOT NULL DEFAULT 'free',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `marketplaceProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `marketplaceProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `premiumInterest` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `premiumInterest_id` PRIMARY KEY(`id`),
	CONSTRAINT `premiumInterest_userId_unique` UNIQUE(`userId`)
);
