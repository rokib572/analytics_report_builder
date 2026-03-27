ALTER TABLE "auth_data"."app_integrations" ALTER COLUMN "app_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "auth_data"."app_integrations" ADD COLUMN "app_secret" text NOT NULL;