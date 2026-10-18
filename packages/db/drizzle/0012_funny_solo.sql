CREATE TABLE "guild_staff_members" (
	"guild_id" text NOT NULL,
	"user_id" text NOT NULL,
	"username" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"is_staff" boolean DEFAULT false NOT NULL,
	"is_moderator" boolean DEFAULT false NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guild_staff_members_guild_id_user_id_pk" PRIMARY KEY("guild_id","user_id")
);
