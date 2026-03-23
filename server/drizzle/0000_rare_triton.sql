CREATE TABLE "devices" (
	"id" uuid PRIMARY KEY NOT NULL,
	"push_token" text,
	"platform" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_id" uuid NOT NULL,
	"title" text NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"reminder_minutes_before" integer DEFAULT 30 NOT NULL,
	"recurrence" text DEFAULT 'NONE' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"original_message" text DEFAULT '' NOT NULL,
	"reminder_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_schedules_device_id" ON "schedules" USING btree ("device_id");