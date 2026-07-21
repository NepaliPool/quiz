ALTER TABLE "quiz_attempts" DROP CONSTRAINT IF EXISTS "quiz_attempts_access_code_id_uid";--> statement-breakpoint
ALTER TABLE "access_codes" ADD COLUMN IF NOT EXISTS "is_revoked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "access_codes" ADD COLUMN IF NOT EXISTS "revoked_at" timestamp;--> statement-breakpoint
ALTER TABLE "access_codes" ADD COLUMN IF NOT EXISTS "is_shared" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD COLUMN IF NOT EXISTS "participant_name" text;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD COLUMN IF NOT EXISTS "participant_name_key" text;--> statement-breakpoint
ALTER TABLE "quiz_sets" ADD COLUMN IF NOT EXISTS "is_free_mock" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "quiz_attempts_one_time_access_code_uid" ON "quiz_attempts" USING btree ("access_code_id") WHERE "quiz_attempts"."participant_name_key" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "quiz_attempts_access_code_id_idx" ON "quiz_attempts" USING btree ("access_code_id");--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "access_codes" ADD CONSTRAINT "access_codes_revoked_consistency" CHECK (("access_codes"."is_revoked" = false AND "access_codes"."revoked_at" IS NULL) OR ("access_codes"."is_revoked" = true AND "access_codes"."revoked_at" IS NOT NULL));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "access_codes" ADD CONSTRAINT "access_codes_shared_requires_expiry" CHECK ("access_codes"."is_shared" = false OR "access_codes"."expires_at" IS NOT NULL);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_participant_name_consistency" CHECK (("quiz_attempts"."participant_name" IS NULL AND "quiz_attempts"."participant_name_key" IS NULL) OR ("quiz_attempts"."participant_name" IS NOT NULL AND "quiz_attempts"."participant_name_key" IS NOT NULL));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
