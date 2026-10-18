CREATE TABLE "erlc_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"server_name" text,
	"status" text DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"last_active_at" timestamp with time zone DEFAULT now() NOT NULL,
	"peak_players" integer DEFAULT 0 NOT NULL,
	"sample_count" integer DEFAULT 0 NOT NULL,
	"player_sample_total" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
