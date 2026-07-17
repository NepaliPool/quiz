-- Align section totals with stored question marks (idempotent).
UPDATE "quiz_sections" AS qs
SET "full_marks" = (
  SELECT COALESCE(SUM(q."marks"), 0)::integer
  FROM "questions" q
  WHERE q."quiz_section_id" = qs."id"
)
WHERE EXISTS (
  SELECT 1 FROM "questions" q WHERE q."quiz_section_id" = qs."id"
);--> statement-breakpoint
-- Temporarily clear completed scores so max_score can shrink without
-- violating quiz_attempts_score_lte_max.
UPDATE "quiz_attempts"
SET "score" = 0
WHERE "status" = 'completed';--> statement-breakpoint
-- Keep attempt max_score in sync with current quiz totals.
UPDATE "quiz_attempts" AS qa
SET "max_score" = (
  SELECT COALESCE(SUM(qs."full_marks"), 0)::integer
  FROM "quiz_sections" qs
  WHERE qs."quiz_set_id" = qa."quiz_set_id"
);--> statement-breakpoint
-- Recompute completed attempt scores from stored answers + question marks.
UPDATE "quiz_attempts" AS qa
SET "score" = LEAST(
  (
    SELECT COALESCE(SUM(q."marks"), 0)::integer
    FROM "attempt_answers" aa
    INNER JOIN "questions" q ON q."id" = aa."question_id"
    WHERE aa."attempt_id" = qa."id"
      AND aa."is_correct" = true
  ),
  qa."max_score"
)
WHERE qa."status" = 'completed';
