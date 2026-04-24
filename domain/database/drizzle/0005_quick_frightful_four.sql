CREATE TABLE "core_data"."labor_break_types" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"location_id" char(26) NOT NULL,
	"square_id" varchar(255) NOT NULL,
	"break_name" varchar(255) NOT NULL,
	"expected_duration" varchar(50) NOT NULL,
	"expected_duration_minutes" integer,
	"is_paid" boolean NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"synced_at" timestamp,
	CONSTRAINT "labor_break_types_square_id_unique" UNIQUE("square_id")
);
--> statement-breakpoint
CREATE TABLE "core_data"."labor_scheduled_shifts" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"location_id" char(26) NOT NULL,
	"square_id" varchar(255) NOT NULL,
	"team_member_id" varchar(255),
	"job_title" varchar(255),
	"job_id" varchar(255),
	"work_date" date NOT NULL,
	"start_at" timestamp NOT NULL,
	"end_at" timestamp NOT NULL,
	"scheduled_minutes" bigint,
	"status" varchar(50),
	"notes" varchar(1000),
	"content_hash" varchar(64) NOT NULL,
	"synced_at" timestamp,
	"square_created_at" timestamp,
	"square_updated_at" timestamp,
	CONSTRAINT "labor_scheduled_shifts_square_id_unique" UNIQUE("square_id")
);
--> statement-breakpoint
CREATE TABLE "core_data"."labor_team_member_wages" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"square_id" varchar(255) NOT NULL,
	"team_member_id" varchar(255) NOT NULL,
	"job_title" varchar(255),
	"job_id" varchar(255),
	"hourly_wage_cents" bigint,
	"tip_eligible" boolean,
	"content_hash" varchar(64) NOT NULL,
	"synced_at" timestamp,
	CONSTRAINT "labor_team_member_wages_square_id_unique" UNIQUE("square_id")
);
--> statement-breakpoint
CREATE TABLE "core_data"."labor_timecards" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"location_id" char(26) NOT NULL,
	"square_id" varchar(255) NOT NULL,
	"team_member_id" varchar(255) NOT NULL,
	"job_title" varchar(255),
	"job_id" varchar(255),
	"work_date" date NOT NULL,
	"start_at" timestamp NOT NULL,
	"end_at" timestamp,
	"status" varchar(50),
	"hourly_wage_cents" bigint,
	"total_paid_hours_milli" bigint,
	"total_labor_cost_cents" bigint,
	"declared_cash_tips_cents" bigint,
	"paid_break_minutes" bigint,
	"unpaid_break_minutes" bigint,
	"breaks" jsonb,
	"timezone" varchar(100),
	"content_hash" varchar(64) NOT NULL,
	"synced_at" timestamp,
	"square_created_at" timestamp,
	"square_updated_at" timestamp,
	CONSTRAINT "labor_timecards_square_id_unique" UNIQUE("square_id")
);
--> statement-breakpoint
ALTER TABLE "core_data"."labor_break_types" ADD CONSTRAINT "labor_break_types_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."labor_break_types" ADD CONSTRAINT "labor_break_types_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "core_data"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."labor_scheduled_shifts" ADD CONSTRAINT "labor_scheduled_shifts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."labor_scheduled_shifts" ADD CONSTRAINT "labor_scheduled_shifts_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "core_data"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."labor_team_member_wages" ADD CONSTRAINT "labor_team_member_wages_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."labor_timecards" ADD CONSTRAINT "labor_timecards_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."labor_timecards" ADD CONSTRAINT "labor_timecards_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "core_data"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "labor_break_types_customer_idx" ON "core_data"."labor_break_types" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "labor_break_types_location_idx" ON "core_data"."labor_break_types" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "labor_scheduled_shifts_location_date_idx" ON "core_data"."labor_scheduled_shifts" USING btree ("location_id","work_date");--> statement-breakpoint
CREATE INDEX "labor_scheduled_shifts_customer_date_idx" ON "core_data"."labor_scheduled_shifts" USING btree ("customer_id","work_date");--> statement-breakpoint
CREATE INDEX "labor_team_member_wages_customer_idx" ON "core_data"."labor_team_member_wages" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "labor_team_member_wages_team_member_idx" ON "core_data"."labor_team_member_wages" USING btree ("team_member_id");--> statement-breakpoint
CREATE INDEX "labor_timecards_location_date_idx" ON "core_data"."labor_timecards" USING btree ("location_id","work_date");--> statement-breakpoint
CREATE INDEX "labor_timecards_customer_date_idx" ON "core_data"."labor_timecards" USING btree ("customer_id","work_date");--> statement-breakpoint
CREATE INDEX "labor_timecards_team_member_idx" ON "core_data"."labor_timecards" USING btree ("team_member_id");