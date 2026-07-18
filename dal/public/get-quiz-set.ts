import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { faculties, quizSets } from "@/db/schema";

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

export type PublicQuizSetDetail = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  durationMinutes: number;
  faculty: {
    id: string;
    name: string;
    slug: string;
  };
  sections: PublicQuizSection[];
  questionCount: number;
  totalMarks: number;
};

export async function getPublishedQuizSetByFacultyAndSlug(
  facultySlug: string,
  quizSetSlug: string,
): Promise<PublicQuizSetDetail | null> {
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

  const sections: PublicQuizSection[] = quizSet.sections.map((section) => ({
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

  return {
    id: quizSet.id,
    title: quizSet.title,
    slug: quizSet.slug,
    description: quizSet.description,
    durationMinutes: quizSet.durationMinutes,
    faculty,
    sections,
    questionCount: sections.reduce(
      (sum, section) => sum + section.questions.length,
      0,
    ),
    totalMarks: sections.reduce((sum, section) => sum + section.fullMarks, 0),
  };
}

export async function getPublishedQuizSetRouteByAccessCode(code: string) {
  const normalized = code.trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  const row = await db.query.accessCodes.findFirst({
    where: (table, { eq: equals }) => equals(table.code, normalized),
    with: {
      attempt: {
        columns: {
          id: true,
          status: true,
        },
      },
      quizSet: {
        columns: {
          id: true,
          slug: true,
          isPublished: true,
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

  return {
    code: row.code,
    quizSetId: row.quizSet.id,
    facultySlug: row.quizSet.faculty.slug,
    quizSetSlug: row.quizSet.slug,
    attemptId: row.attempt?.id ?? null,
    attemptStatus: row.attempt?.status ?? null,
  };
}
