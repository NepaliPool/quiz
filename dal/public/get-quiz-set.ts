import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { faculties, quizAttempts, quizSets } from "@/db/schema";

export type PublicQuizOption = {
  id: string;
  label: string;
  position: number;
};

export type PublicQuizQuestion = {
  id: string;
  prompt: string;
  position: number;
  options: PublicQuizOption[];
};

/** Section summary for the public unlock page — no question prompts/options. */
export type PublicQuizSectionSummary = {
  id: string;
  subject: {
    id: string;
    name: string;
  };
  fullMarks: number;
  position: number;
  questionCount: number;
};

/** Full section with questions — only returned after a valid start/resume. */
export type PublicQuizSection = {
  id: string;
  subject: {
    id: string;
    name: string;
  };
  fullMarks: number;
  position: number;
  questions: PublicQuizQuestion[];
};

/** Metadata shown before an access code is accepted. */
export type PublicQuizSetMeta = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  durationMinutes: number;
  isFreeMock: boolean;
  faculty: {
    id: string;
    name: string;
    slug: string;
  };
  sections: PublicQuizSectionSummary[];
  questionCount: number;
  totalMarks: number;
};

/** @deprecated Prefer PublicQuizSetMeta — kept as an alias for call sites. */
export type PublicQuizSetDetail = PublicQuizSetMeta;

export async function getPublishedQuizSetByFacultyAndSlug(
  facultySlug: string,
  quizSetSlug: string,
): Promise<PublicQuizSetMeta | null> {
  const faculty = await db.query.faculties.findFirst({
    where: eq(faculties.slug, facultySlug),
    columns: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!faculty) {
    return null;
  }

  const quizSet = await db.query.quizSets.findFirst({
    where: and(
      eq(quizSets.facultyId, faculty.id),
      eq(quizSets.slug, quizSetSlug),
      eq(quizSets.isPublished, true),
    ),
    columns: {
      id: true,
      title: true,
      slug: true,
      description: true,
      durationMinutes: true,
      isFreeMock: true,
    },
    with: {
      sections: {
        orderBy: (table, { asc: orderAsc }) => [orderAsc(table.position)],
        columns: {
          id: true,
          fullMarks: true,
          position: true,
        },
        with: {
          subject: {
            columns: {
              id: true,
              name: true,
            },
          },
          questions: {
            columns: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!quizSet) {
    return null;
  }

  const sections: PublicQuizSectionSummary[] = quizSet.sections.map(
    (section) => ({
      id: section.id,
      subject: {
        id: section.subject.id,
        name: section.subject.name,
      },
      fullMarks: section.fullMarks,
      position: section.position,
      questionCount: section.questions.length,
    }),
  );

  return {
    id: quizSet.id,
    title: quizSet.title,
    slug: quizSet.slug,
    description: quizSet.description,
    durationMinutes: quizSet.durationMinutes,
    isFreeMock: quizSet.isFreeMock,
    faculty,
    sections,
    questionCount: sections.reduce(
      (sum, section) => sum + section.questionCount,
      0,
    ),
    totalMarks: sections.reduce((sum, section) => sum + section.fullMarks, 0),
  };
}

/**
 * Load take payload (prompts + options, no isCorrect) for an in-progress attempt.
 * Returns null if the attempt is missing, completed, or the quiz is unpublished.
 */
export async function getPublishedQuizQuestionsForAttempt(
  attemptId: string,
): Promise<PublicQuizSection[] | null> {
  const attempt = await db.query.quizAttempts.findFirst({
    where: eq(quizAttempts.id, attemptId),
    columns: {
      id: true,
      status: true,
      quizSetId: true,
    },
    with: {
      quizSet: {
        columns: {
          id: true,
          isPublished: true,
        },
      },
    },
  });

  if (
    !attempt ||
    attempt.status !== "in_progress" ||
    !attempt.quizSet.isPublished
  ) {
    return null;
  }

  return loadPublishedQuizQuestions(attempt.quizSetId);
}

async function loadPublishedQuizQuestions(
  quizSetId: string,
): Promise<PublicQuizSection[] | null> {
  const quizSet = await db.query.quizSets.findFirst({
    where: and(eq(quizSets.id, quizSetId), eq(quizSets.isPublished, true)),
    columns: {
      id: true,
    },
    with: {
      sections: {
        orderBy: (table, { asc: orderAsc }) => [orderAsc(table.position)],
        with: {
          subject: {
            columns: {
              id: true,
              name: true,
            },
          },
          questions: {
            orderBy: (table, { asc: orderAsc }) => [orderAsc(table.position)],
            columns: {
              id: true,
              prompt: true,
              position: true,
            },
            with: {
              options: {
                columns: {
                  id: true,
                  label: true,
                  position: true,
                },
                orderBy: (table, { asc: orderAsc }) => [
                  orderAsc(table.position),
                ],
              },
            },
          },
        },
      },
    },
  });

  if (!quizSet) {
    return null;
  }

  return quizSet.sections.map((section) => ({
    id: section.id,
    subject: {
      id: section.subject.id,
      name: section.subject.name,
    },
    fullMarks: section.fullMarks,
    position: section.position,
    questions: section.questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      position: question.position,
      options: question.options.map((option) => ({
        id: option.id,
        label: option.label,
        position: option.position,
      })),
    })),
  }));
}

export async function getPublishedQuizSetRouteByAccessCode(code: string) {
  const normalized = code.trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  const row = await db.query.accessCodes.findFirst({
    where: (table, { eq: equals }) => equals(table.code, normalized),
    columns: {
      id: true,
      code: true,
      isRevoked: true,
      isShared: true,
      expiresAt: true,
    },
    with: {
      quizSet: {
        columns: {
          id: true,
          slug: true,
          isPublished: true,
          isFreeMock: true,
        },
        with: {
          faculty: {
            columns: {
              slug: true,
            },
          },
        },
      },
    },
  });

  if (!row || !row.quizSet.isPublished) {
    return null;
  }

  if (row.isRevoked) {
    return null;
  }

  const now = new Date();
  const isShared = row.isShared;

  if (row.quizSet.isFreeMock && !isShared) {
    return null;
  }

  if (isShared) {
    if (!row.expiresAt || row.expiresAt.getTime() < now.getTime()) {
      return null;
    }
  }

  let attemptId: string | null = null;
  let attemptStatus: "in_progress" | "completed" | null = null;

  if (!isShared) {
    const attempt = await db.query.quizAttempts.findFirst({
      where: eq(quizAttempts.accessCodeId, row.id),
      columns: { id: true, status: true },
    });
    attemptId = attempt?.id ?? null;
    attemptStatus = attempt?.status ?? null;
  }

  return {
    code: row.code,
    quizSetId: row.quizSet.id,
    facultySlug: row.quizSet.faculty.slug,
    quizSetSlug: row.quizSet.slug,
    isFreeMock: row.quizSet.isFreeMock,
    attemptId,
    attemptStatus,
  };
}
