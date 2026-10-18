CREATE TABLE "application_advanced_settings" (
	"form_id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"application_prefix" text DEFAULT 'APP' NOT NULL,
	"cooldown_hours" integer DEFAULT 0 NOT NULL,
	"max_total_submissions" integer,
	"auto_close_at_limit" boolean DEFAULT false NOT NULL,
	"min_discord_account_age_days" integer DEFAULT 0 NOT NULL,
	"min_server_join_age_days" integer DEFAULT 0 NOT NULL,
	"required_role_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"blocked_role_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reviewer_role_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"scoring_enabled" boolean DEFAULT false NOT NULL,
	"smart_review_enabled" boolean DEFAULT false NOT NULL,
	"applicant_dm_enabled" boolean DEFAULT true NOT NULL,
	"submit_message" text,
	"interview_message" text,
	"accepted_message" text,
	"denied_message" text,
	"success_message" text,
	"branding_accent" text,
	"banner_url" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_appeals" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"submission_id" text NOT NULL,
	"applicant_user_id" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewer_user_id" text,
	"reviewer_username" text,
	"reviewer_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "application_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"submission_id" text NOT NULL,
	"reviewer_user_id" text NOT NULL,
	"reviewer_username" text NOT NULL,
	"status" text DEFAULT 'assigned' NOT NULL,
	"assigned_by_user_id" text,
	"assigned_by_username" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"form_id" text,
	"submission_id" text,
	"actor_user_id" text,
	"actor_username" text,
	"action" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_custom_statuses" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"form_id" text,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"terminal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_interviews" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"submission_id" text NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"scheduled_for" timestamp with time zone,
	"interviewer_user_id" text,
	"interviewer_username" text,
	"notes" text,
	"outcome" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_portal_slugs" (
	"slug" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_question_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"submission_id" text NOT NULL,
	"question_id" text NOT NULL,
	"reviewer_user_id" text NOT NULL,
	"reviewer_username" text NOT NULL,
	"score" integer NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_question_settings" (
	"question_id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"form_id" text NOT NULL,
	"min_length" integer,
	"max_length" integer,
	"weight" integer DEFAULT 1 NOT NULL,
	"conditional_question_id" text,
	"conditional_operator" text,
	"conditional_value" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"submission_id" text NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"actor_user_id" text,
	"actor_username" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_submission_codes" (
	"submission_id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"form_id" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"form_snapshot" jsonb NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
