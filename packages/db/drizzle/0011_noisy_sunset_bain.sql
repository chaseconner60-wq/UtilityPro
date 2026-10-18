CREATE TABLE "health_daily_active_members" (
	"guild_id" text NOT NULL,
	"date" text NOT NULL,
	"user_id" text NOT NULL,
	"first_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"message_count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "health_daily_active_members_guild_id_date_user_id_pk" PRIMARY KEY("guild_id","date","user_id")
);
--> statement-breakpoint
CREATE TABLE "health_daily_metrics" (
	"guild_id" text NOT NULL,
	"date" text NOT NULL,
	"messages" integer DEFAULT 0 NOT NULL,
	"joins" integer DEFAULT 0 NOT NULL,
	"leaves" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "health_daily_metrics_guild_id_date_pk" PRIMARY KEY("guild_id","date")
);
--> statement-breakpoint
CREATE TABLE "health_hourly_activity" (
	"guild_id" text NOT NULL,
	"hour" timestamp with time zone NOT NULL,
	"messages" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "health_hourly_activity_guild_id_hour_pk" PRIMARY KEY("guild_id","hour")
);
--> statement-breakpoint
CREATE TABLE "health_member_lifecycle" (
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"joined_at" timestamp with time zone,
	"left_at" timestamp with time zone,
	"first_message_at" timestamp with time zone,
	"last_message_at" timestamp with time zone,
	"message_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "health_member_lifecycle_guild_id_user_id_pk" PRIMARY KEY("guild_id","user_id")
);
