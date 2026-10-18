CREATE TABLE "erlc_managed_session_participants" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"department" text,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"qualified" boolean DEFAULT false NOT NULL,
	"is_staff" boolean DEFAULT false NOT NULL,
	"first_seen_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erlc_managed_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"title" text NOT NULL,
	"session_type" text DEFAULT 'patrol' NOT NULL,
	"host_user_id" text NOT NULL,
	"host_username" text NOT NULL,
	"co_hosts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"minimum_attendance_seconds" integer DEFAULT 900 NOT NULL,
	"notes" text,
	"scheduled_for" timestamp with time zone,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
