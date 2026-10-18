CREATE TABLE "erlc_player_attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"team" text,
	"callsign" text,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erlc_players" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"current_team" text,
	"callsign" text,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"total_seconds" integer DEFAULT 0 NOT NULL,
	"sessions_attended" integer DEFAULT 0 NOT NULL,
	"join_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
