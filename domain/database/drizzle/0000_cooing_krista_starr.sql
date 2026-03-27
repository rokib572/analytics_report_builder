CREATE SCHEMA IF NOT EXISTS "auth_data";--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "core_data";--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "report_data";--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "audit_data";--> statement-breakpoint
CREATE TABLE "auth_data"."api_keys" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"app_name" varchar(100) NOT NULL,
	"key_value" text NOT NULL,
	"environment" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"label" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "auth_data"."ba_account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" timestamp,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_data"."ba_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ba_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "auth_data"."ba_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ba_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "auth_data"."ba_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_data"."customers" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "core_data"."daily_sales" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"location_id" char(26) NOT NULL,
	"sale_date" date NOT NULL,
	"gross_sales" bigint DEFAULT 0 NOT NULL,
	"total_discounts" bigint DEFAULT 0 NOT NULL,
	"total_returns" bigint DEFAULT 0 NOT NULL,
	"net_sales" bigint DEFAULT 0 NOT NULL,
	"total_tax" bigint DEFAULT 0 NOT NULL,
	"total_tips" bigint DEFAULT 0 NOT NULL,
	"total_service_charges" bigint DEFAULT 0 NOT NULL,
	"total_collected" bigint DEFAULT 0 NOT NULL,
	"store_gross_sales" bigint DEFAULT 0 NOT NULL,
	"uber_gross_sales" bigint DEFAULT 0 NOT NULL,
	"uber_bogo_discount_amount" bigint DEFAULT 0 NOT NULL,
	"uber_bogo_recoverable" bigint DEFAULT 0 NOT NULL,
	"order_count" integer DEFAULT 0 NOT NULL,
	"synced_at" timestamp DEFAULT now() NOT NULL,
	"sync_source" varchar(50) NOT NULL,
	CONSTRAINT "daily_sales_location_id_sale_date_unique" UNIQUE("location_id","sale_date")
);
--> statement-breakpoint
CREATE TABLE "core_data"."locations" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" jsonb,
	"status" varchar(50) NOT NULL,
	"timezone" varchar(100),
	"synced_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "core_data"."order_line_items" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"order_id" char(26) NOT NULL,
	"location_id" char(26) NOT NULL,
	"sale_date" date NOT NULL,
	"name" varchar(255) NOT NULL,
	"variation_name" varchar(255),
	"catalog_object_id" varchar(255),
	"quantity" varchar(50) NOT NULL,
	"channel" varchar(10) NOT NULL,
	"base_price_money" bigint,
	"gross_sales_money" bigint,
	"total_discount_money" bigint,
	"total_tax_money" bigint,
	"total_money" bigint
);
--> statement-breakpoint
CREATE TABLE "core_data"."orders" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"location_id" char(26) NOT NULL,
	"sale_date" date NOT NULL,
	"state" varchar(50) NOT NULL,
	"total_money" bigint,
	"total_tax_money" bigint,
	"total_discount_money" bigint,
	"total_tip_money" bigint,
	"total_service_charge_money" bigint,
	"net_amounts" jsonb,
	"return_amounts" jsonb,
	"source_name" varchar(255),
	"raw_json" jsonb NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_data"."permissions" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"user_id" char(26) NOT NULL,
	"resource" varchar(100) NOT NULL,
	"action" varchar(50) NOT NULL,
	"allowed" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_data"."saved_reports" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"name" varchar(255) NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_data"."sync_log" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"sync_type" varchar(50) NOT NULL,
	"location_id" char(26),
	"date_from" date NOT NULL,
	"date_to" date NOT NULL,
	"square_count" integer,
	"db_count" integer,
	"discrepancy" integer,
	"orders_fetched" integer,
	"status" varchar(20) NOT NULL,
	"error_message" varchar(1000),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_data"."users" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"better_auth_user_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_better_auth_user_id_unique" UNIQUE("better_auth_user_id")
);
--> statement-breakpoint
CREATE TABLE "audit_data"."webhook_log" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"event_id" varchar(255) NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"merchant_id" varchar(255),
	"location_id" varchar(255),
	"order_id" varchar(255),
	"signature_valid" boolean NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_log_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
ALTER TABLE "auth_data"."api_keys" ADD CONSTRAINT "api_keys_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_data"."ba_account" ADD CONSTRAINT "ba_account_user_id_ba_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth_data"."ba_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_data"."ba_session" ADD CONSTRAINT "ba_session_user_id_ba_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth_data"."ba_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."daily_sales" ADD CONSTRAINT "daily_sales_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "core_data"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."locations" ADD CONSTRAINT "locations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."order_line_items" ADD CONSTRAINT "order_line_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "core_data"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."order_line_items" ADD CONSTRAINT "order_line_items_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "core_data"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."orders" ADD CONSTRAINT "orders_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "core_data"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_data"."permissions" ADD CONSTRAINT "permissions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_data"."permissions" ADD CONSTRAINT "permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth_data"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_data"."saved_reports" ADD CONSTRAINT "saved_reports_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_data"."sync_log" ADD CONSTRAINT "sync_log_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "core_data"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_data"."users" ADD CONSTRAINT "users_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_keys_customer_id_idx" ON "auth_data"."api_keys" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "daily_sales_sale_date_idx" ON "core_data"."daily_sales" USING btree ("sale_date");--> statement-breakpoint
CREATE INDEX "daily_sales_location_id_idx" ON "core_data"."daily_sales" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "daily_sales_location_date_idx" ON "core_data"."daily_sales" USING btree ("location_id","sale_date");--> statement-breakpoint
CREATE INDEX "line_items_order_id_idx" ON "core_data"."order_line_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "line_items_location_date_idx" ON "core_data"."order_line_items" USING btree ("location_id","sale_date");--> statement-breakpoint
CREATE INDEX "orders_location_date_idx" ON "core_data"."orders" USING btree ("location_id","sale_date");--> statement-breakpoint
CREATE INDEX "permissions_user_id_idx" ON "auth_data"."permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "permissions_customer_id_idx" ON "auth_data"."permissions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "users_customer_id_idx" ON "auth_data"."users" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "webhook_event_id_idx" ON "audit_data"."webhook_log" USING btree ("event_id");