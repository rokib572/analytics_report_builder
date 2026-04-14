CREATE SCHEMA IF NOT EXISTS "auth_data";--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "core_data";--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "report_data";--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "audit_data";--> statement-breakpoint

CREATE TABLE "auth_data"."app_integrations" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"app_name" varchar(100) NOT NULL,
	"app_key" text,
	"app_secret" text,
	"oauth_access_token" text,
	"oauth_refresh_token" text,
	"oauth_expires_at" timestamp,
	"merchant_id" varchar(255),
	"scopes" text,
	"webhook_subscription_id" varchar(255),
	"webhook_signature_key" text,
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
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"id_token" text,
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
CREATE TABLE "auth_data"."oauth_state" (
	"state" varchar(64) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"user_id" varchar(26) NOT NULL,
	"environment" varchar(20) NOT NULL,
	"backfill_scope" varchar(10) DEFAULT '12m' NOT NULL,
	"consumed" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_data"."customers" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"company_name" varchar(255),
	"business_type" varchar(100),
	"business_size" varchar(50),
	"phone" varchar(50),
	"address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "auth_data"."invitations" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"token" char(26) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"invited_by" char(26) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
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
CREATE TABLE "core_data"."catalog_categories" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"square_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"parent_category_id" varchar(255),
	"is_top_level" boolean,
	"content_hash" varchar(64) NOT NULL,
	"synced_at" timestamp,
	CONSTRAINT "catalog_categories_square_id_unique" UNIQUE("square_id")
);
--> statement-breakpoint
CREATE TABLE "core_data"."catalog_discounts" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"square_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"discount_type" varchar(32),
	"percentage" varchar(32),
	"amount_money" bigint,
	"pin_required" boolean,
	"content_hash" varchar(64) NOT NULL,
	"synced_at" timestamp,
	CONSTRAINT "catalog_discounts_square_id_unique" UNIQUE("square_id")
);
--> statement-breakpoint
CREATE TABLE "core_data"."catalog_item_variations" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"square_id" varchar(255) NOT NULL,
	"item_id" char(26) NOT NULL,
	"name" varchar(255),
	"sku" varchar(255),
	"price_money" bigint,
	"price_currency" varchar(3),
	"ordinal" integer,
	"content_hash" varchar(64) NOT NULL,
	"synced_at" timestamp,
	CONSTRAINT "catalog_item_variations_square_id_unique" UNIQUE("square_id")
);
--> statement-breakpoint
CREATE TABLE "core_data"."catalog_items" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"square_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category_id" varchar(255),
	"is_archived" boolean,
	"reporting_category_id" varchar(255),
	"content_hash" varchar(64) NOT NULL,
	"synced_at" timestamp,
	CONSTRAINT "catalog_items_square_id_unique" UNIQUE("square_id")
);
--> statement-breakpoint
CREATE TABLE "core_data"."catalog_modifier_lists" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"square_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"selection_type" varchar(32),
	"ordinal" integer,
	"content_hash" varchar(64) NOT NULL,
	"synced_at" timestamp,
	CONSTRAINT "catalog_modifier_lists_square_id_unique" UNIQUE("square_id")
);
--> statement-breakpoint
CREATE TABLE "core_data"."catalog_modifiers" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"square_id" varchar(255) NOT NULL,
	"modifier_list_id" char(26) NOT NULL,
	"name" varchar(255) NOT NULL,
	"price_money" bigint,
	"price_currency" varchar(3),
	"ordinal" integer,
	"content_hash" varchar(64) NOT NULL,
	"synced_at" timestamp,
	CONSTRAINT "catalog_modifiers_square_id_unique" UNIQUE("square_id")
);
--> statement-breakpoint
CREATE TABLE "core_data"."catalog_taxes" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"square_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"percentage" varchar(32),
	"inclusion_type" varchar(32),
	"applies_to_custom_amounts" boolean,
	"enabled" boolean,
	"content_hash" varchar(64) NOT NULL,
	"synced_at" timestamp,
	CONSTRAINT "catalog_taxes_square_id_unique" UNIQUE("square_id")
);
--> statement-breakpoint
CREATE TABLE "core_data"."square_customers" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"square_id" varchar(255) NOT NULL,
	"given_name" varchar(255) NOT NULL,
	"family_name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"reference_id" varchar(255),
	"creation_source" varchar(255),
	"created_at" timestamp with time zone NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"synced_at" timestamp,
	CONSTRAINT "square_customers_square_id_unique" UNIQUE("square_id")
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
CREATE TABLE "core_data"."inventory_adjustments" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"location_id" char(26) NOT NULL,
	"square_id" varchar(255) NOT NULL,
	"catalog_object_id" varchar(255) NOT NULL,
	"catalog_item_variation_id" char(26),
	"catalog_object_type" varchar(50),
	"from_state" varchar(50),
	"to_state" varchar(50),
	"quantity" varchar(50) NOT NULL,
	"total_price_money" bigint,
	"occurred_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"team_member_id" varchar(255),
	"transaction_id" varchar(255),
	"refund_id" varchar(255),
	"purchase_order_id" varchar(255),
	"goods_receipt_id" varchar(255),
	"reason" varchar(255),
	"content_hash" varchar(64) NOT NULL,
	"synced_at" timestamp,
	CONSTRAINT "inventory_adjustments_square_id_unique" UNIQUE("square_id")
);
--> statement-breakpoint
CREATE TABLE "core_data"."inventory_counts" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"location_id" char(26) NOT NULL,
	"catalog_object_id" varchar(255) NOT NULL,
	"catalog_item_variation_id" char(26),
	"catalog_object_type" varchar(50),
	"state" varchar(50) NOT NULL,
	"quantity" varchar(50) NOT NULL,
	"is_estimated" boolean NOT NULL,
	"calculated_at" timestamp NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"synced_at" timestamp,
	CONSTRAINT "inventory_counts_location_id_catalog_object_id_state_unique" UNIQUE("location_id","catalog_object_id","state")
);
--> statement-breakpoint
CREATE TABLE "core_data"."inventory_transfers" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"square_id" varchar(255) NOT NULL,
	"catalog_object_id" varchar(255) NOT NULL,
	"catalog_item_variation_id" char(26),
	"catalog_object_type" varchar(50),
	"from_location_id" char(26),
	"to_location_id" char(26),
	"from_square_location_id" varchar(255),
	"to_square_location_id" varchar(255),
	"state" varchar(50),
	"quantity" varchar(50) NOT NULL,
	"occurred_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"team_member_id" varchar(255),
	"content_hash" varchar(64) NOT NULL,
	"synced_at" timestamp,
	CONSTRAINT "inventory_transfers_square_id_unique" UNIQUE("square_id")
);
--> statement-breakpoint
CREATE TABLE "core_data"."locations" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"square_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" jsonb,
	"status" varchar(50) NOT NULL,
	"timezone" varchar(100),
	"content_hash" varchar(64) NOT NULL,
	"synced_at" timestamp,
	CONSTRAINT "locations_square_id_unique" UNIQUE("square_id")
);
--> statement-breakpoint
CREATE TABLE "core_data"."order_fulfillments" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"order_id" char(26) NOT NULL,
	"square_uid" varchar(255),
	"type" varchar(50) NOT NULL,
	"state" varchar(50) NOT NULL,
	"pickup_at" timestamp,
	"delivered_at" timestamp,
	"canceled_at" timestamp
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
	"total_money" bigint,
	"modifiers" jsonb,
	"applied_discounts" jsonb,
	"applied_taxes" jsonb
);
--> statement-breakpoint
CREATE TABLE "core_data"."order_tenders" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"order_id" char(26) NOT NULL,
	"location_id" char(26) NOT NULL,
	"square_id" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"amount_money" bigint,
	"tip_money" bigint,
	"processing_fee_money" bigint,
	"card_brand" varchar(50),
	"card_last4" varchar(4),
	"card_entry_method" varchar(50),
	"square_customer_id" varchar(255),
	"payment_id" varchar(255),
	CONSTRAINT "order_tenders_square_id_unique" UNIQUE("square_id")
);
--> statement-breakpoint
CREATE TABLE "core_data"."orders" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"location_id" char(26) NOT NULL,
	"square_id" varchar(255) NOT NULL,
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
	"square_customer_id" varchar(255),
	"ticket_name" varchar(255),
	"closed_at" timestamp,
	"fulfillment_type" varchar(50),
	"raw_json" jsonb NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"synced_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "orders_square_id_unique" UNIQUE("square_id")
);
--> statement-breakpoint
CREATE TABLE "core_data"."payments" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"location_id" char(26) NOT NULL,
	"square_id" varchar(255) NOT NULL,
	"order_id" varchar(255),
	"status" varchar(50) NOT NULL,
	"source_type" varchar(50),
	"amount_money" bigint,
	"tip_money" bigint,
	"total_money" bigint,
	"app_fee_money" bigint,
	"refunded_money" bigint,
	"processing_fee_money" bigint,
	"card_brand" varchar(50),
	"card_last4" varchar(4),
	"card_entry_method" varchar(50),
	"risk_level" varchar(50),
	"square_customer_id" varchar(255),
	"team_member_id" varchar(255),
	"device_id" varchar(255),
	"application_id" varchar(255),
	"receipt_url" varchar(500),
	"content_hash" varchar(64) NOT NULL,
	"synced_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "payments_square_id_unique" UNIQUE("square_id")
);
--> statement-breakpoint
CREATE TABLE "core_data"."refunds" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"location_id" char(26) NOT NULL,
	"square_id" varchar(255) NOT NULL,
	"payment_id" varchar(255),
	"order_id" varchar(255),
	"status" varchar(50) NOT NULL,
	"amount_money" bigint NOT NULL,
	"app_fee_money" bigint,
	"processing_fee_money" bigint,
	"reason" varchar(500),
	"destination_type" varchar(50),
	"unlinked" boolean DEFAULT false NOT NULL,
	"team_member_id" varchar(255),
	"square_customer_id" varchar(255),
	"content_hash" varchar(64) NOT NULL,
	"synced_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "refunds_square_id_unique" UNIQUE("square_id")
);
--> statement-breakpoint
CREATE TABLE "audit_data"."sync_log" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
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
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
	"updated_at" timestamp DEFAULT now() NOT NULL
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
ALTER TABLE "auth_data"."app_integrations" ADD CONSTRAINT "app_integrations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_data"."ba_account" ADD CONSTRAINT "ba_account_user_id_ba_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth_data"."ba_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_data"."ba_session" ADD CONSTRAINT "ba_session_user_id_ba_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth_data"."ba_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_data"."oauth_state" ADD CONSTRAINT "oauth_state_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_data"."invitations" ADD CONSTRAINT "invitations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_data"."invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "auth_data"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_data"."permissions" ADD CONSTRAINT "permissions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_data"."permissions" ADD CONSTRAINT "permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth_data"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_data"."saved_reports" ADD CONSTRAINT "saved_reports_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."catalog_categories" ADD CONSTRAINT "catalog_categories_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."catalog_discounts" ADD CONSTRAINT "catalog_discounts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."catalog_item_variations" ADD CONSTRAINT "catalog_item_variations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."catalog_item_variations" ADD CONSTRAINT "catalog_item_variations_item_id_catalog_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "core_data"."catalog_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."catalog_items" ADD CONSTRAINT "catalog_items_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."catalog_modifier_lists" ADD CONSTRAINT "catalog_modifier_lists_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."catalog_modifiers" ADD CONSTRAINT "catalog_modifiers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."catalog_modifiers" ADD CONSTRAINT "catalog_modifiers_modifier_list_id_catalog_modifier_lists_id_fk" FOREIGN KEY ("modifier_list_id") REFERENCES "core_data"."catalog_modifier_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."catalog_taxes" ADD CONSTRAINT "catalog_taxes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."square_customers" ADD CONSTRAINT "square_customers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."daily_sales" ADD CONSTRAINT "daily_sales_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "core_data"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "core_data"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."inventory_adjustments" ADD CONSTRAINT "inventory_adjustments_catalog_item_variation_id_catalog_item_variations_id_fk" FOREIGN KEY ("catalog_item_variation_id") REFERENCES "core_data"."catalog_item_variations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."inventory_counts" ADD CONSTRAINT "inventory_counts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."inventory_counts" ADD CONSTRAINT "inventory_counts_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "core_data"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."inventory_counts" ADD CONSTRAINT "inventory_counts_catalog_item_variation_id_catalog_item_variations_id_fk" FOREIGN KEY ("catalog_item_variation_id") REFERENCES "core_data"."catalog_item_variations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."inventory_transfers" ADD CONSTRAINT "inventory_transfers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."inventory_transfers" ADD CONSTRAINT "inventory_transfers_catalog_item_variation_id_catalog_item_variations_id_fk" FOREIGN KEY ("catalog_item_variation_id") REFERENCES "core_data"."catalog_item_variations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."inventory_transfers" ADD CONSTRAINT "inventory_transfers_from_location_id_locations_id_fk" FOREIGN KEY ("from_location_id") REFERENCES "core_data"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."inventory_transfers" ADD CONSTRAINT "inventory_transfers_to_location_id_locations_id_fk" FOREIGN KEY ("to_location_id") REFERENCES "core_data"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."locations" ADD CONSTRAINT "locations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."order_fulfillments" ADD CONSTRAINT "order_fulfillments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "core_data"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."order_line_items" ADD CONSTRAINT "order_line_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "core_data"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."order_line_items" ADD CONSTRAINT "order_line_items_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "core_data"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."order_tenders" ADD CONSTRAINT "order_tenders_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "core_data"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."order_tenders" ADD CONSTRAINT "order_tenders_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "core_data"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."orders" ADD CONSTRAINT "orders_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "core_data"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."payments" ADD CONSTRAINT "payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."payments" ADD CONSTRAINT "payments_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "core_data"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."refunds" ADD CONSTRAINT "refunds_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "core_data"."refunds" ADD CONSTRAINT "refunds_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "core_data"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_data"."sync_log" ADD CONSTRAINT "sync_log_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_data"."sync_log" ADD CONSTRAINT "sync_log_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "core_data"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_data"."users" ADD CONSTRAINT "users_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "app_integrations_customer_id_idx" ON "auth_data"."app_integrations" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "invitations_customer_id_idx" ON "auth_data"."invitations" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "invitations_email_idx" ON "auth_data"."invitations" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_token_idx" ON "auth_data"."invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "permissions_user_id_idx" ON "auth_data"."permissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "permissions_customer_id_idx" ON "auth_data"."permissions" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_unique_idx" ON "auth_data"."permissions" USING btree ("customer_id","user_id","resource","action");--> statement-breakpoint
CREATE INDEX "catalog_categories_customer_id_idx" ON "core_data"."catalog_categories" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "catalog_discounts_customer_id_idx" ON "core_data"."catalog_discounts" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "catalog_discounts_discount_type_idx" ON "core_data"."catalog_discounts" USING btree ("discount_type");--> statement-breakpoint
CREATE INDEX "catalog_item_variations_customer_id_idx" ON "core_data"."catalog_item_variations" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "catalog_item_variations_item_id_idx" ON "core_data"."catalog_item_variations" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "catalog_item_variations_sku_idx" ON "core_data"."catalog_item_variations" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "catalog_items_customer_id_idx" ON "core_data"."catalog_items" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "catalog_items_category_id_idx" ON "core_data"."catalog_items" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "catalog_modifier_lists_customer_id_idx" ON "core_data"."catalog_modifier_lists" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "catalog_modifier_lists_selection_type_idx" ON "core_data"."catalog_modifier_lists" USING btree ("selection_type");--> statement-breakpoint
CREATE INDEX "catalog_modifiers_customer_id_idx" ON "core_data"."catalog_modifiers" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "catalog_modifiers_modifier_list_id_idx" ON "core_data"."catalog_modifiers" USING btree ("modifier_list_id");--> statement-breakpoint
CREATE INDEX "catalog_taxes_customer_id_idx" ON "core_data"."catalog_taxes" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "catalog_taxes_inclusion_type_idx" ON "core_data"."catalog_taxes" USING btree ("inclusion_type");--> statement-breakpoint
CREATE INDEX "square_customer_id_idx" ON "core_data"."square_customers" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "square_customers_square_id_idx" ON "core_data"."square_customers" USING btree ("square_id");--> statement-breakpoint
CREATE INDEX "square_customers_email_idx" ON "core_data"."square_customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "square_customers_phone_idx" ON "core_data"."square_customers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "daily_sales_sale_date_idx" ON "core_data"."daily_sales" USING btree ("sale_date");--> statement-breakpoint
CREATE INDEX "daily_sales_location_id_idx" ON "core_data"."daily_sales" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "daily_sales_location_date_idx" ON "core_data"."daily_sales" USING btree ("location_id","sale_date");--> statement-breakpoint
CREATE INDEX "inventory_adjustments_customer_id_idx" ON "core_data"."inventory_adjustments" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "inventory_adjustments_location_occurred_idx" ON "core_data"."inventory_adjustments" USING btree ("location_id","occurred_at");--> statement-breakpoint
CREATE INDEX "inventory_adjustments_catalog_object_id_idx" ON "core_data"."inventory_adjustments" USING btree ("catalog_object_id");--> statement-breakpoint
CREATE INDEX "inventory_adjustments_transaction_id_idx" ON "core_data"."inventory_adjustments" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "inventory_adjustments_refund_id_idx" ON "core_data"."inventory_adjustments" USING btree ("refund_id");--> statement-breakpoint
CREATE INDEX "inventory_counts_customer_id_idx" ON "core_data"."inventory_counts" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "inventory_counts_location_calculated_idx" ON "core_data"."inventory_counts" USING btree ("location_id","calculated_at");--> statement-breakpoint
CREATE INDEX "inventory_counts_catalog_object_id_idx" ON "core_data"."inventory_counts" USING btree ("catalog_object_id");--> statement-breakpoint
CREATE INDEX "inventory_counts_catalog_item_variation_id_idx" ON "core_data"."inventory_counts" USING btree ("catalog_item_variation_id");--> statement-breakpoint
CREATE INDEX "inventory_transfers_customer_id_idx" ON "core_data"."inventory_transfers" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "inventory_transfers_occurred_idx" ON "core_data"."inventory_transfers" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "inventory_transfers_from_location_id_idx" ON "core_data"."inventory_transfers" USING btree ("from_location_id");--> statement-breakpoint
CREATE INDEX "inventory_transfers_to_location_id_idx" ON "core_data"."inventory_transfers" USING btree ("to_location_id");--> statement-breakpoint
CREATE INDEX "inventory_transfers_catalog_object_id_idx" ON "core_data"."inventory_transfers" USING btree ("catalog_object_id");--> statement-breakpoint
CREATE INDEX "locations_customer_id_idx" ON "core_data"."locations" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "order_fulfillments_order_id_idx" ON "core_data"."order_fulfillments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "line_items_order_id_idx" ON "core_data"."order_line_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "line_items_location_date_idx" ON "core_data"."order_line_items" USING btree ("location_id","sale_date");--> statement-breakpoint
CREATE INDEX "order_tenders_order_id_idx" ON "core_data"."order_tenders" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_location_date_idx" ON "core_data"."orders" USING btree ("location_id","sale_date");--> statement-breakpoint
CREATE INDEX "orders_customer_id_idx" ON "core_data"."orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_square_customer_id_idx" ON "core_data"."orders" USING btree ("square_customer_id");--> statement-breakpoint
CREATE INDEX "payments_location_date_idx" ON "core_data"."payments" USING btree ("location_id","created_at");--> statement-breakpoint
CREATE INDEX "payments_customer_id_idx" ON "core_data"."payments" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "payments_order_id_idx" ON "core_data"."payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payments_square_customer_id_idx" ON "core_data"."payments" USING btree ("square_customer_id");--> statement-breakpoint
CREATE INDEX "refunds_location_date_idx" ON "core_data"."refunds" USING btree ("location_id","created_at");--> statement-breakpoint
CREATE INDEX "refunds_customer_id_idx" ON "core_data"."refunds" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "refunds_payment_id_idx" ON "core_data"."refunds" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "refunds_order_id_idx" ON "core_data"."refunds" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "users_customer_id_idx" ON "auth_data"."users" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_customer_email_idx" ON "auth_data"."users" USING btree ("customer_id","email");--> statement-breakpoint
CREATE INDEX "webhook_event_id_idx" ON "audit_data"."webhook_log" USING btree ("event_id");