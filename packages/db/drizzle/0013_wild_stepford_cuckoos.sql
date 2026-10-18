CREATE TABLE "erlc_connections" (
	"guild_id" text PRIMARY KEY NOT NULL,
	"server_key_encrypted" text NOT NULL,
	"server_key_iv" text NOT NULL,
	"server_key_auth_tag" text NOT NULL,
	"internal_server_id" text,
	"server_name" text,
	"join_code" text,
	"current_players" integer DEFAULT 0 NOT NULL,
	"max_players" integer DEFAULT 0 NOT NULL,
	"connection_status" text DEFAULT 'connected' NOT NULL,
	"last_checked_at" timestamp with time zone,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
