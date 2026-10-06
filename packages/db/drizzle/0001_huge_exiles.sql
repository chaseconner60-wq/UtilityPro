CREATE TABLE "global_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"maintenance_enabled" boolean DEFAULT false NOT NULL,
	"maintenance_message" text DEFAULT 'UtilityX is currently undergoing maintenance. Commands are temporarily unavailable.' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
