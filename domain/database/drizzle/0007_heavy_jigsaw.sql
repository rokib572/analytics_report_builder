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
ALTER TABLE "core_data"."square_customers" ADD CONSTRAINT "square_customers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "square_customer_id_idx" ON "core_data"."square_customers" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "square_customers_square_id_idx" ON "core_data"."square_customers" USING btree ("square_id");--> statement-breakpoint
CREATE INDEX "square_customers_email_idx" ON "core_data"."square_customers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "square_customers_phone_idx" ON "core_data"."square_customers" USING btree ("phone");