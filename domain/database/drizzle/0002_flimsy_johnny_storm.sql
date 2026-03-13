ALTER TABLE "auth_data"."customers" ADD COLUMN "company_name" varchar(255);--> statement-breakpoint
ALTER TABLE "auth_data"."customers" ADD COLUMN "business_type" varchar(100);--> statement-breakpoint
ALTER TABLE "auth_data"."customers" ADD COLUMN "business_size" varchar(50);--> statement-breakpoint
ALTER TABLE "auth_data"."customers" ADD COLUMN "phone" varchar(50);--> statement-breakpoint
ALTER TABLE "auth_data"."customers" ADD COLUMN "address" text;