ALTER TABLE "access_codes" ADD COLUMN "is_issued" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "access_codes" ADD COLUMN "issued_at" timestamp;--> statement-breakpoint
ALTER TABLE "access_codes" ADD CONSTRAINT "access_codes_issued_consistency" CHECK ((
  ("is_issued" = false AND "issued_at" IS NULL)
  OR ("is_issued" = true AND "issued_at" IS NOT NULL)
));
