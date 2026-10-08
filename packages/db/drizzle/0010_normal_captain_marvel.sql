ALTER TABLE "guild_settings" ADD COLUMN "automod_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "automod_log_channel_id" text;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "anti_spam_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "spam_message_limit" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "spam_interval_seconds" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "duplicate_messages_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "max_mentions" integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "caps_filter_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "caps_percentage" integer DEFAULT 75 NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "blocked_words" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "block_invites" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "block_links" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "automod_action" text DEFAULT 'delete' NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "automod_timeout_minutes" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "automod_exempt_role_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "automod_exempt_channel_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;