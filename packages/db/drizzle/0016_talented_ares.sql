CREATE TABLE "erlc_department_mappings" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"source_team" text NOT NULL,
	"department_name" text NOT NULL,
	"is_staff_department" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erlc_management_settings" (
	"guild_id" text PRIMARY KEY NOT NULL,
	"minimum_tracked_seconds" integer DEFAULT 3600 NOT NULL,
	"minimum_sessions" integer DEFAULT 2 NOT NULL,
	"inactivity_days" integer DEFAULT 14 NOT NULL,
	"promotion_ready_seconds" integer DEFAULT 10800 NOT NULL,
	"promotion_ready_sessions" integer DEFAULT 5 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "erlc_staff_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"is_staff" boolean DEFAULT true NOT NULL,
	"role" text,
	"department" text,
	"rank" text,
	"notes" text,
	"activity_exempt" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
