CREATE TABLE "banned_guilds" (
	"guild_id" text PRIMARY KEY NOT NULL,
	"guild_name" text DEFAULT 'Unknown Guild' NOT NULL,
	"reason" text NOT NULL,
	"banned_by" text NOT NULL,
	"banned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "owner_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"guild_id" text,
	"guild_name" text,
	"reason" text,
	"message" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"result" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
