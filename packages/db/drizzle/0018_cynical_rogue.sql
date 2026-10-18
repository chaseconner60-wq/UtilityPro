CREATE TABLE "application_answers" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"question_id" text NOT NULL,
	"guild_id" text NOT NULL,
	"value" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_forms" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"review_channel_id" text,
	"accepted_role_id" text,
	"max_applications_per_user" integer DEFAULT 1 NOT NULL,
	"opens_at" timestamp with time zone,
	"closes_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_portals" (
	"guild_id" text PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"portal_name" text DEFAULT 'Applications' NOT NULL,
	"welcome_message" text,
	"review_channel_id" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"form_id" text NOT NULL,
	"guild_id" text NOT NULL,
	"label" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'short' NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"submission_id" text NOT NULL,
	"guild_id" text NOT NULL,
	"action" text NOT NULL,
	"reviewer_user_id" text NOT NULL,
	"reviewer_username" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"form_id" text NOT NULL,
	"applicant_user_id" text NOT NULL,
	"applicant_username" text NOT NULL,
	"applicant_avatar" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewer_user_id" text,
	"reviewer_username" text,
	"reviewer_notes" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
