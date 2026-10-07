CREATE TABLE "guild_channels" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"name" text NOT NULL,
	"type" integer NOT NULL,
	"parent_id" text,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guild_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"managed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "welcome_channel_id" text;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "goodbye_channel_id" text;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "logging_channel_id" text;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "ticket_category_id" text;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "ticket_access_role_id" text;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "staff_role_id" text;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "moderator_role_id" text;