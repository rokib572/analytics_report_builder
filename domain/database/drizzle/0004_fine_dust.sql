CREATE TABLE "core_data"."channels" (
	"id" char(26) PRIMARY KEY NOT NULL,
	"customer_id" char(26) NOT NULL,
	"square_source_name" varchar(255) NOT NULL,
	"display_name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "channels_customer_source_name_unique" UNIQUE("customer_id","square_source_name")
);
--> statement-breakpoint
ALTER TABLE "core_data"."orders" ADD COLUMN "channel_id" char(26);--> statement-breakpoint
ALTER TABLE "core_data"."channels" ADD CONSTRAINT "channels_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "channels_customer_id_idx" ON "core_data"."channels" USING btree ("customer_id");--> statement-breakpoint
ALTER TABLE "core_data"."orders" ADD CONSTRAINT "orders_channel_id_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "core_data"."channels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_channel_id_idx" ON "core_data"."orders" USING btree ("channel_id");