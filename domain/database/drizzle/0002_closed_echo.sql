CREATE TABLE "audit_data"."sync_run_details" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"sync_run_id" char(26) NOT NULL,
	"data_type" varchar(100) NOT NULL,
	"changed_count" integer DEFAULT 0 NOT NULL,
	"unchanged_count" integer DEFAULT 0 NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"changed_record_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"failed_records" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_data"."sync_runs" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"trigger_type" varchar(50) NOT NULL,
	"status" varchar(50) NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"error_message" varchar(1000)
);
--> statement-breakpoint
ALTER TABLE "audit_data"."webhook_log" ADD COLUMN "customer_id" char(26);--> statement-breakpoint
ALTER TABLE "audit_data"."webhook_log" ADD COLUMN "payment_id" varchar(255);--> statement-breakpoint
ALTER TABLE "audit_data"."webhook_log" ADD COLUMN "refund_id" varchar(255);--> statement-breakpoint
ALTER TABLE "audit_data"."webhook_log" ADD COLUMN "processing_result" varchar(50);--> statement-breakpoint
ALTER TABLE "audit_data"."webhook_log" ADD COLUMN "processing_error" varchar(1000);--> statement-breakpoint
ALTER TABLE "audit_data"."webhook_log" ADD COLUMN "processed_at" timestamp;--> statement-breakpoint
ALTER TABLE "audit_data"."sync_run_details" ADD CONSTRAINT "sync_run_details_sync_run_id_sync_runs_id_fk" FOREIGN KEY ("sync_run_id") REFERENCES "audit_data"."sync_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_data"."sync_runs" ADD CONSTRAINT "sync_runs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_data"."webhook_log" ADD CONSTRAINT "webhook_log_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;