CREATE TABLE "guild_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"result" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"channel_id" text NOT NULL,
	"user_id" text NOT NULL,
	"claimed_by" text,
	"status" text DEFAULT 'open' NOT NULL,
	"close_reason" text,
	"transcript" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "ticket_panel_channel_id" text;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "ticket_log_channel_id" text;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "ticket_panel_message_id" text;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "ticket_panel_title" text DEFAULT 'Support Tickets' NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "ticket_panel_message" text DEFAULT 'Need help? Click the button below to create a private support ticket.' NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "ticket_channel_name" text DEFAULT 'ticket-{username}' NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "ticket_one_per_user" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "guild_settings" ADD COLUMN "ticket_transcripts_enabled" boolean DEFAULT true NOT NULL;