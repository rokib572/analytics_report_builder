ALTER TABLE "auth_data"."ba_account" ADD COLUMN "access_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "auth_data"."ba_account" ADD COLUMN "refresh_token_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "auth_data"."ba_account" ADD COLUMN "scope" text;--> statement-breakpoint
ALTER TABLE "auth_data"."ba_account" ADD COLUMN "id_token" text;