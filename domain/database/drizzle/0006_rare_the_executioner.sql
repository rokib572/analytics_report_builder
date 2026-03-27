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
ALTER TABLE "auth_data"."users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "auth_data"."users" DROP CONSTRAINT "users_better_auth_user_id_unique";--> statement-breakpoint
ALTER TABLE "core_data"."locations" ADD COLUMN "square_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "core_data"."locations" ADD COLUMN "content_hash" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_data"."invitations" ADD CONSTRAINT "invitations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "auth_data"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_data"."invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "auth_data"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invitations_customer_id_idx" ON "auth_data"."invitations" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "invitations_email_idx" ON "auth_data"."invitations" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_token_idx" ON "auth_data"."invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "locations_customer_id_idx" ON "core_data"."locations" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_customer_email_idx" ON "auth_data"."users" USING btree ("customer_id","email");--> statement-breakpoint
ALTER TABLE "core_data"."locations" ADD CONSTRAINT "locations_square_id_unique" UNIQUE("square_id");