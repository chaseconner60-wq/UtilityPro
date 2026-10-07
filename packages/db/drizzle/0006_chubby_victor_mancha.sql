ALTER TABLE "guild_settings" ADD COLUMN "auto_role_id" text;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "welcome_use_embed" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "goodbye_use_embed" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "auto_role_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "log_member_events" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "log_message_deletes" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "log_role_changes" boolean DEFAULT true NOT NULL;