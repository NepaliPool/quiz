ALTER TABLE "questions" ADD COLUMN "marks" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_marks_positive" CHECK ("questions"."marks" > 0);--> statement-breakpoint
-- Keep section full_marks aligned with 1 mark per question for existing rows.
UPDATE "quiz_sections" AS qs
SET "full_marks" = (
  SELECT COUNT(*)::integer FROM "questions" q WHERE q."quiz_section_id" = qs."id"
)
WHERE EXISTS (
  SELECT 1 FROM "questions" q WHERE q."quiz_section_id" = qs."id"
);
