CREATE TABLE "moderation_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"type" text NOT NULL,
	"target_user_id" text,
	"moderator_id" text NOT NULL,
	"reason" text,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warnings" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"moderator_id" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "moderation_log_channel_id" text;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "warn_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "timeout_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "kick_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "ban_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "purge_enabled" boolean DEFAULT true NOT NULL;