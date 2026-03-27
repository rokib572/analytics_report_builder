CREATE TABLE "auth_data"."app_integrations" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"app_name" varchar(100) NOT NULL,
	"app_key" text NOT NULL,
	"environment" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"label" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp
);
--> statement-breakpoint
DROP TABLE "auth_data"."api_keys" CASCADE;--> statement-breakpoint
ALTER TABLE "auth_data"."app_integrations" ADD CONSTRAINT "app_integrations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_integrations_customer_id_idx" ON "auth_data"."app_integrations" USING btree ("customer_id");