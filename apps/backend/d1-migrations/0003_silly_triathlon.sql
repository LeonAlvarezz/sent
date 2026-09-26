PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_campaign` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`list_id` integer,
	`audience_type` text DEFAULT 'custom',
	`target_job_title` text,
	`sender_id` integer NOT NULL,
	`pitch_profile_id` integer,
	`name` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`delay_min_seconds` integer DEFAULT 15 NOT NULL,
	`delay_max_seconds` integer DEFAULT 45 NOT NULL,
	`total_count` integer DEFAULT 0 NOT NULL,
	`sent_count` integer DEFAULT 0 NOT NULL,
	`failed_count` integer DEFAULT 0 NOT NULL,
	`started_at` integer,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`list_id`) REFERENCES `email_list`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`sender_id`) REFERENCES `sender_identity`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pitch_profile_id`) REFERENCES `pitch_profile`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_campaign`("id", "user_id", "list_id", "sender_id", "pitch_profile_id", "name", "subject", "body", "status", "delay_min_seconds", "delay_max_seconds", "total_count", "sent_count", "failed_count", "started_at", "completed_at", "created_at", "updated_at") SELECT "id", "user_id", "list_id", "sender_id", "pitch_profile_id", "name", "subject", "body", "status", "delay_min_seconds", "delay_max_seconds", "total_count", "sent_count", "failed_count", "started_at", "completed_at", "created_at", "updated_at" FROM `campaign`;--> statement-breakpoint
DROP TABLE `campaign`;--> statement-breakpoint
ALTER TABLE `__new_campaign` RENAME TO `campaign`;--> statement-breakpoint
PRAGMA foreign_keys=ON;