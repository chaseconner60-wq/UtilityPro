CREATE TABLE "guild_settings" (
	"guild_id" text PRIMARY KEY NOT NULL,
	"welcome_enabled" boolean DEFAULT false NOT NULL,
	"welcome_message" text DEFAULT 'Welcome {user} to {server}!' NOT NULL,
	"goodbye_enabled" boolean DEFAULT false NOT NULL,
	"goodbye_message" text DEFAULT '{user} has left {server}.' NOT NULL,
	"tickets_enabled" boolean DEFAULT false NOT NULL,
	"logging_enabled" boolean DEFAULT false NOT NULL,
	"moderation_enabled" boolean DEFAULT true NOT NULL,
	"automation_enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
