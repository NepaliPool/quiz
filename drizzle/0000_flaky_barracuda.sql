CREATE TYPE "public"."quiz_attempt_status" AS ENUM('in_progress', 'completed');--> statement-breakpoint
CREATE TABLE "access_codes" (
	"id" text PRIMARY KEY NOT NULL,
	"quiz_set_id" text NOT NULL,
	"code" text NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"used_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "access_codes_used_consistency" CHECK (("access_codes"."is_used" = false AND "access_codes"."used_at" IS NULL) OR ("access_codes"."is_used" = true AND "access_codes"."used_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attempt_answers" (
	"id" text PRIMARY KEY NOT NULL,
	"attempt_id" text NOT NULL,
	"question_id" text NOT NULL,
	"option_id" text NOT NULL,
	"is_correct" boolean NOT NULL,
	"answered_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "attempt_answers_attempt_id_question_id_uid" UNIQUE("attempt_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "faculties" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "options" (
	"id" text PRIMARY KEY NOT NULL,
	"question_id" text NOT NULL,
	"label" text NOT NULL,
	"position" smallint NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "options_question_id_position_uid" UNIQUE("question_id","position"),
	CONSTRAINT "options_position_range" CHECK ("options"."position" >= 1 AND "options"."position" <= 4)
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" text PRIMARY KEY NOT NULL,
	"quiz_section_id" text NOT NULL,
	"prompt" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "questions_section_id_position_uid" UNIQUE("quiz_section_id","position"),
	CONSTRAINT "questions_position_positive" CHECK ("questions"."position" > 0)
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"quiz_set_id" text NOT NULL,
	"access_code_id" text NOT NULL,
	"status" "quiz_attempt_status" DEFAULT 'in_progress' NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"max_score" integer NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "quiz_attempts_access_code_id_uid" UNIQUE("access_code_id"),
	CONSTRAINT "quiz_attempts_score_non_negative" CHECK ("quiz_attempts"."score" >= 0),
	CONSTRAINT "quiz_attempts_max_score_positive" CHECK ("quiz_attempts"."max_score" > 0),
	CONSTRAINT "quiz_attempts_score_lte_max" CHECK ("quiz_attempts"."score" <= "quiz_attempts"."max_score"),
	CONSTRAINT "quiz_attempts_completed_consistency" CHECK (("quiz_attempts"."status" = 'in_progress' AND "quiz_attempts"."completed_at" IS NULL) OR ("quiz_attempts"."status" = 'completed' AND "quiz_attempts"."completed_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "quiz_sections" (
	"id" text PRIMARY KEY NOT NULL,
	"quiz_set_id" text NOT NULL,
	"subject_id" text NOT NULL,
	"full_marks" integer NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_sections_set_subject_uid" UNIQUE("quiz_set_id","subject_id"),
	CONSTRAINT "quiz_sections_set_position_uid" UNIQUE("quiz_set_id","position"),
	CONSTRAINT "quiz_sections_full_marks_positive" CHECK ("quiz_sections"."full_marks" > 0),
	CONSTRAINT "quiz_sections_position_positive" CHECK ("quiz_sections"."position" > 0)
);
--> statement-breakpoint
CREATE TABLE "quiz_sets" (
	"id" text PRIMARY KEY NOT NULL,
	"faculty_id" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"duration_minutes" integer DEFAULT 120 NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_by_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quiz_sets_faculty_id_slug_uid" UNIQUE("faculty_id","slug"),
	CONSTRAINT "quiz_sets_duration_minutes_positive" CHECK ("quiz_sets"."duration_minutes" > 0)
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" text PRIMARY KEY NOT NULL,
	"faculty_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subjects_faculty_id_name_uid" UNIQUE("faculty_id","name")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_role_allowed" CHECK ("user"."role" IN ('admin', 'superadmin', 'user'))
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "access_codes" ADD CONSTRAINT "access_codes_quiz_set_id_quiz_sets_id_fk" FOREIGN KEY ("quiz_set_id") REFERENCES "public"."quiz_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_attempt_id_quiz_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_option_id_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."options"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "options" ADD CONSTRAINT "options_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_quiz_section_id_quiz_sections_id_fk" FOREIGN KEY ("quiz_section_id") REFERENCES "public"."quiz_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_set_id_quiz_sets_id_fk" FOREIGN KEY ("quiz_set_id") REFERENCES "public"."quiz_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_access_code_id_access_codes_id_fk" FOREIGN KEY ("access_code_id") REFERENCES "public"."access_codes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_sections" ADD CONSTRAINT "quiz_sections_quiz_set_id_quiz_sets_id_fk" FOREIGN KEY ("quiz_set_id") REFERENCES "public"."quiz_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_sections" ADD CONSTRAINT "quiz_sections_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_sets" ADD CONSTRAINT "quiz_sets_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_sets" ADD CONSTRAINT "quiz_sets_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_faculty_id_faculties_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculties"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "access_codes_code_uid" ON "access_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "access_codes_quiz_set_id_idx" ON "access_codes" USING btree ("quiz_set_id");--> statement-breakpoint
CREATE INDEX "access_codes_quiz_set_id_unused_idx" ON "access_codes" USING btree ("quiz_set_id") WHERE "access_codes"."is_used" = false;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "attempt_answers_attempt_id_idx" ON "attempt_answers" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "attempt_answers_question_id_idx" ON "attempt_answers" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "faculties_name_uid" ON "faculties" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "faculties_slug_uid" ON "faculties" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "options_question_id_idx" ON "options" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "options_one_correct_per_question_uid" ON "options" USING btree ("question_id") WHERE "options"."is_correct" = true;--> statement-breakpoint
CREATE INDEX "questions_quiz_section_id_idx" ON "questions" USING btree ("quiz_section_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_quiz_set_id_idx" ON "quiz_attempts" USING btree ("quiz_set_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_quiz_set_id_status_idx" ON "quiz_attempts" USING btree ("quiz_set_id","status");--> statement-breakpoint
CREATE INDEX "quiz_sections_quiz_set_id_idx" ON "quiz_sections" USING btree ("quiz_set_id");--> statement-breakpoint
CREATE INDEX "quiz_sections_subject_id_idx" ON "quiz_sections" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "quiz_sets_faculty_id_idx" ON "quiz_sets" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "quiz_sets_is_published_idx" ON "quiz_sets" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "quiz_sets_created_by_id_idx" ON "quiz_sets" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subjects_faculty_id_idx" ON "subjects" USING btree ("faculty_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");