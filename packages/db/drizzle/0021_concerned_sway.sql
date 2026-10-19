CREATE TABLE "application_applicant_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"applicant_user_id" text NOT NULL,
	"author_user_id" text NOT NULL,
	"author_username" text NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_automation_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"form_id" text,
	"name" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"trigger_type" text NOT NULL,
	"trigger_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"actions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_form_branding" (
	"form_id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"accent_color" text,
	"logo_url" text,
	"banner_url" text,
	"header_title" text,
	"header_subtitle" text,
	"submit_button_label" text,
	"success_title" text,
	"success_message" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_form_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"form_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_notification_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"form_id" text,
	"event" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"channel_id" text,
	"ping_applicant" boolean DEFAULT false NOT NULL,
	"ping_role_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"embed_title" text,
	"embed_description" text,
	"embed_footer" text,
	"embed_color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_permission_groups" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"form_id" text,
	"name" text NOT NULL,
	"role_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_workflow_stages" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"form_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"stage_type" text DEFAULT 'review' NOT NULL,
	"terminal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
